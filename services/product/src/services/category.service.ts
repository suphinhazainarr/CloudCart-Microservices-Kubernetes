import { Category, ICategory } from '../models/Category.model';
import { redisService } from './redis.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/product.dto';
import { NotFoundError, ValidationError } from '@cloudcart/shared';

const CACHE_KEYS = {
  allCategories: 'categories:all',
  category: (id: string) => `category:${id}`,
};

class CategoryService {

  async getAllCategories(): Promise<ICategory[]> {
    return redisService.cacheAside(
      CACHE_KEYS.allCategories,
      () => Category.find({ isActive: true }).sort({ name: 1 }),
      600 // cache categories for 10 minutes — they change rarely
    );
  }

  async getCategoryById(id: string): Promise<ICategory> {
    return redisService.cacheAside(
      CACHE_KEYS.category(id),
      async () => {
        const category = await Category.findById(id);
        if (!category) throw new NotFoundError('Category');
        return category;
      }
    );
  }

  async createCategory(dto: CreateCategoryDto): Promise<ICategory> {
    const existing = await Category.findOne({ slug: dto.slug });
    if (existing) throw new ValidationError('A category with this name already exists');

    const category = await Category.create(dto);
    await this.invalidateCaches();
    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<ICategory> {
    const category = await Category.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true, runValidators: true }
    );
    if (!category) throw new NotFoundError('Category');
    await this.invalidateCaches(id);
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await Category.findById(id);
    if (!category) throw new NotFoundError('Category');

    // Soft delete — never hard delete categories; products reference them
    category.isActive = false;
    await category.save();
    await this.invalidateCaches(id);
  }

  private async invalidateCaches(id?: string): Promise<void> {
    await redisService.delete(CACHE_KEYS.allCategories);
    if (id) await redisService.delete(CACHE_KEYS.category(id));
  }
}

export const categoryService = new CategoryService();
