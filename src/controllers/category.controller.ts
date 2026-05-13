import { Request, Response, NextFunction } from 'express';
import * as CategoryService from '../services/category.service';

export const listCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await CategoryService.getCategories();
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
};

export const getCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cat = await CategoryService.getCategoryBySlug(req.params.slug);
    res.json({ success: true, data: cat });
  } catch (err) { next(err); }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cat = await CategoryService.createCategory(req.body);
    res.status(201).json({ success: true, data: cat });
  } catch (err) { next(err); }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cat = await CategoryService.updateCategory(req.params.id, req.body);
    res.json({ success: true, data: cat });
  } catch (err) { next(err); }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await CategoryService.deleteCategory(req.params.id);
    res.json({ success: true, message: 'Category deactivated' });
  } catch (err) { next(err); }
};
