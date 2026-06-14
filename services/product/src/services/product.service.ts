import mongoose from 'mongoose';
import { Product, IProduct } from '../models/Product.model';
import { Category } from '../models/Category.model';
import { redisService } from './redis.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from '../dto/product.dto';
import {
  NotFoundError,
  ValidationError,
} from '@cloudcart/shared';

// What a paginated list response looks like
export interface PaginatedProducts {
  products: IProduct[];
  meta: {
    total:      number;
    page:       number;
    limit:      number;
    totalPages: number;
    hasNext:    boolean;
    hasPrev:    boolean;
  };
}

const CACHE_KEYS = {
  product:  (id: string)  => `product:${id}`,
  products: (query: string) => `products:${query}`,
};

class ProductService {

  // ─── Get all (with filtering, search, sort, pagination) ──────────────────

  async getProducts(query: ProductQueryDto): Promise<PaginatedProducts> {
    // Build a deterministic cache key from the query params
    const cacheKey = CACHE_KEYS.products(
      `p${query.page}:l${query.limit}:s${query.sort}:c${query.category || ''}:` +
      `q${query.search || ''}:min${query.minPrice || ''}:max${query.maxPrice || ''}:` +
      `stock${query.inStock}:feat${query.featured}`
    );

    return redisService.cacheAside(
      cacheKey,
      () => this.fetchProductsFromDb(query)
    );
  }

  private async fetchProductsFromDb(query: ProductQueryDto): Promise<PaginatedProducts> {
    const {
      page, limit, sort, category, search,
      minPrice, maxPrice, inStock, featured,
    } = query;

    // ─── Build the filter object ──────────────────────────────────────────
    const filter: mongoose.FilterQuery<IProduct> = { isActive: true };

    // Text search — uses the weighted text index
    if (search) {
      filter.$text = { $search: search };
    }

    // Category filter — accept either a slug or an ObjectId
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category = category;
      } else {
        // Resolve slug to ObjectId
        const cat = await Category.findOne({ slug: category, isActive: true });
        if (cat) {
          filter.category = cat._id;
        } else {
          // If category slug is not found, force query to return no results
          filter.category = new mongoose.Types.ObjectId();
        }
      }
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    // Stock
    if (inStock) filter.stock = { $gt: 0 };

    // Featured
    if (featured) filter.isFeatured = true;

    // ─── Build the sort object ────────────────────────────────────────────
    const sortMap: Record<string, Record<string, mongoose.SortOrder>> = {
      newest:       { createdAt: -1 },
      createdAt:    { createdAt: -1 },
      '-createdAt': { createdAt: -1 },
      price_asc:    { price: 1 },
      price:        { price: 1 },
      price_desc:   { price: -1 },
      '-price':     { price: -1 },
      rating:       { 'ratings.average': -1 },
      name:         { name: 1 },
    };

    // When searching, add textScore sort for relevance
    const sortObj = search
      ? { score: { $meta: 'textScore' }, ...sortMap[sort] }
      : sortMap[sort];

    // ─── Execute queries in parallel ──────────────────────────────────────
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortObj as any)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug')  // include category name in response
        .lean(),                             // .lean() returns plain JS objects (faster)
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      products: products as unknown as IProduct[],
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  // ─── Get single product ───────────────────────────────────────────────────

  async getProductById(id: string): Promise<IProduct> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Product');
    }

    return redisService.cacheAside(
      CACHE_KEYS.product(id),
      async () => {
        const product = await Product.findOne({ _id: id, isActive: true })
          .populate('category', 'name slug')
          .lean();
        if (!product) throw new NotFoundError('Product');
        return product as unknown as IProduct;
      }
    );
  }

  async getProductBySlug(slug: string): Promise<IProduct> {
    return redisService.cacheAside(
      `product:slug:${slug}`,
      async () => {
        const product = await Product.findOne({ slug, isActive: true })
          .populate('category', 'name slug')
          .lean();
        if (!product) throw new NotFoundError('Product');
        return product as unknown as IProduct;
      }
    );
  }

  // ─── Create product (admin only) ──────────────────────────────────────────

  async createProduct(dto: CreateProductDto): Promise<IProduct> {
    // Validate category exists
    const category = await Category.findById(dto.category);
    if (!category) throw new ValidationError('Category not found');

    // Check SKU uniqueness
    const skuExists = await Product.findOne({ sku: dto.sku });
    if (skuExists) throw new ValidationError(`SKU '${dto.sku}' already exists`);

    const product = await Product.create(dto);

    // Update denormalised product count on category
    await Category.findByIdAndUpdate(dto.category, { $inc: { productCount: 1 } });

    // Invalidate all product list caches — new product may appear in any list
    await redisService.deletePattern('products:*');

    return product.populate('category', 'name slug');
  }

  // ─── Update product (admin only) ──────────────────────────────────────────

  async updateProduct(id: string, dto: UpdateProductDto): Promise<IProduct> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new NotFoundError('Product');

    // If category is changing, validate the new one exists
    if (dto.category) {
      const category = await Category.findById(dto.category);
      if (!category) throw new ValidationError('Category not found');
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!product) throw new NotFoundError('Product');

    // Invalidate both the specific product cache and all list caches
    await Promise.all([
      redisService.delete(CACHE_KEYS.product(id)),
      redisService.deletePattern('products:*'),
    ]);

    return product;
  }

  // ─── Delete product (admin only — soft delete) ────────────────────────────

  async deleteProduct(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new NotFoundError('Product');

    const product = await Product.findById(id);
    if (!product) throw new NotFoundError('Product');

    // Soft delete — set isActive: false
    // Hard deleting products would break order history
    product.isActive = false;
    await product.save();

    // Decrement category product count
    await Category.findByIdAndUpdate(product.category, {
      $inc: { productCount: -1 },
    });

    await Promise.all([
      redisService.delete(CACHE_KEYS.product(id)),
      redisService.deletePattern('products:*'),
    ]);
  }

  // ─── Update stock (called by order service after purchase) ────────────────

  async decrementStock(productId: string, quantity: number): Promise<void> {
    const product = await Product.findByIdAndUpdate(
      productId,
      { $inc: { stock: -quantity } },
      { new: true }
    );

    if (!product) throw new NotFoundError('Product');
    if (product.stock < 0) {
      // Rollback the decrement — race condition protection
      await Product.findByIdAndUpdate(productId, { $inc: { stock: quantity } });
      throw new ValidationError('Insufficient stock');
    }

    await Promise.all([
      redisService.delete(CACHE_KEYS.product(productId)),
      redisService.deletePattern('products:*'),
    ]);
  }

  async restoreStock(productId: string, quantity: number): Promise<void> {
    await Product.findByIdAndUpdate(productId, { $inc: { stock: quantity } });
    await Promise.all([
      redisService.delete(CACHE_KEYS.product(productId)),
      redisService.deletePattern('products:*'),
    ]);
  }

  // ─── Seed helper (dev only) ───────────────────────────────────────────────

  async getFeaturedProducts(limit = 8): Promise<IProduct[]> {
    return redisService.cacheAside(
      `products:featured:${limit}`,
      () => Product.find({ isActive: true, isFeatured: true })
        .sort({ 'ratings.average': -1 })
        .limit(limit)
        .populate('category', 'name slug')
        .lean() as unknown as Promise<IProduct[]>,
      600
    );
  }
}

export const productService = new ProductService();
