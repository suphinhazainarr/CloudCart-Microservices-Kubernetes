import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';
import { successResponse } from '@cloudcart/shared';

class CategoryController {
  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await categoryService.getAllCategories();
      res.status(200).json(successResponse('Categories retrieved', { categories }));
    } catch (error) { next(error); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      res.status(200).json(successResponse('Category retrieved', { category }));
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await categoryService.createCategory(req.body);
      res.status(201).json(successResponse('Category created', { category }));
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);
      res.status(200).json(successResponse('Category updated', { category }));
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await categoryService.deleteCategory(req.params.id);
      res.status(200).json(successResponse('Category deactivated', null));
    } catch (error) { next(error); }
  };
}

export const categoryController = new CategoryController();
