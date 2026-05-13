import { AppDataSource } from '../config/data-source';
import { Category } from '../models/Category';
import { AppError } from '../middlewares/errorHandler';

const catRepo = () => AppDataSource.getRepository(Category);

const toSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const getCategories = async () => {
  return catRepo().find({
    where: { isActive: true, parentId: undefined as any },
    relations: ['children'],
    order: { sortOrder: 'ASC' },
  });
};

export const getAllCategories = async () => {
  return catRepo().find({
    where: { isActive: true },
    order: { sortOrder: 'ASC' },
  });
};

export const getCategoryBySlug = async (slug: string) => {
  const cat = await catRepo().findOne({
    where: { slug, isActive: true },
    relations: ['children'],
  });
  if (!cat) throw new AppError('Category not found', 404);
  return cat;
};

export const createCategory = async (data: {
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder?: number;
}) => {
  const slug = toSlug(data.name);
  const existing = await catRepo().findOneBy({ slug });
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const cat = catRepo().create({ ...data, slug: finalSlug });
  return catRepo().save(cat);
};

export const updateCategory = async (id: string, data: Partial<Category>) => {
  const cat = await catRepo().findOneBy({ id });
  if (!cat) throw new AppError('Category not found', 404);
  if (data.name) {
    data.slug = toSlug(data.name);
  }
  Object.assign(cat, data);
  return catRepo().save(cat);
};

export const deleteCategory = async (id: string) => {
  const cat = await catRepo().findOneBy({ id });
  if (!cat) throw new AppError('Category not found', 404);
  await catRepo().update(id, { isActive: false });
};
