import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { successResponse, ValidationError } from '@cloudcart/shared';
import { productQueryDto } from '../dto/product.dto';

class ProductController {

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate query params — they come as strings from the URL
      const query = productQueryDto.parse(req.query);
      const result = await productService.getProducts(query);
      res.status(200).json(
        successResponse('Products retrieved', { products: result.products }, result.meta)
      );
    } catch (error) { next(error); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await productService.getProductById(req.params.id);
      res.status(200).json(successResponse('Product retrieved', { product }));
    } catch (error) { next(error); }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await productService.getProductBySlug(req.params.slug);
      res.status(200).json(successResponse('Product retrieved', { product }));
    } catch (error) { next(error); }
  };

  getFeatured = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const products = await productService.getFeaturedProducts();
      res.status(200).json(successResponse('Featured products retrieved', { products }));
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json(successResponse('Product created', { product }));
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      res.status(200).json(successResponse('Product updated', { product }));
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await productService.deleteProduct(req.params.id);
      res.status(200).json(successResponse('Product deleted', null));
    } catch (error) { next(error); }
  };

  decrementStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { quantity } = req.body;
      if (!quantity || quantity < 1) {
        throw new ValidationError('Quantity must be at least 1');
      }
      await productService.decrementStock(req.params.id, quantity);
      res.status(200).json(successResponse('Stock decremented', null));
    } catch (error) { next(error); }
  };

  restoreStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { quantity } = req.body;
      await productService.restoreStock(req.params.id, quantity);
      res.status(200).json(successResponse('Stock restored', null));
    } catch (error) { next(error); }
  };
}

export const productController = new ProductController();
