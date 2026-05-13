import { AppDataSource } from '../config/data-source';
import { Product } from '../models/Product';
import { ProductVariant } from '../models/ProductVariant';
import { Inventory } from '../models/Inventory';
import { Category } from '../models/Category';
import { AppError } from '../middlewares/errorHandler';
import { cacheGet, cacheSet } from '../config/redis';

const productRepo = () => AppDataSource.getRepository(Product);
const variantRepo = () => AppDataSource.getRepository(ProductVariant);
const inventoryRepo = () => AppDataSource.getRepository(Inventory);

interface ProductQuery {
  page?: string;
  limit?: string;
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  brand?: string;
  sortBy?: string;
  featured?: string;
}

export const getProducts = async (query: ProductQuery) => {
  const page = parseInt(query.page || '1');
  const limit = Math.min(parseInt(query.limit || '20'), 100);
  const skip = (page - 1) * limit;

  const qb = productRepo()
    .createQueryBuilder('product')
    .leftJoinAndSelect('product.images', 'images', 'images.isPrimary = true')
    .leftJoinAndSelect('product.category', 'category')
    .leftJoinAndSelect('product.variants', 'variants')
    .leftJoinAndSelect('variants.inventory', 'inventory')
    .where('product.isActive = :active', { active: true });

  if (query.search) {
  qb.andWhere(
    `(
      product.name ILIKE :search OR
      product.slug ILIKE :search OR
      product.description ILIKE :search OR
      product.brand ILIKE :search OR
      category.name ILIKE :search OR
      category.slug ILIKE :search OR
      category.description ILIKE :search
    )`,
    { search: `%${query.search}%` }
  );
}
  if (query.category) {
    qb.andWhere('category.slug = :cat', { cat: query.category });
  }
  if (query.brand) {
    qb.andWhere('product.brand ILIKE :brand', { brand: `%${query.brand}%` });
  }
  if (query.minPrice) {
    qb.andWhere('product.basePrice >= :min', { min: parseFloat(query.minPrice) });
  }
  if (query.maxPrice) {
    qb.andWhere('product.basePrice <= :max', { max: parseFloat(query.maxPrice) });
  }
  if (query.featured === 'true') {
    qb.andWhere('product.isFeatured = true');
  }

  switch (query.sortBy) {
    case 'price_asc': qb.orderBy('product.basePrice', 'ASC'); break;
    case 'price_desc': qb.orderBy('product.basePrice', 'DESC'); break;
    case 'rating': qb.orderBy('product.averageRating', 'DESC'); break;
    default: qb.orderBy('product.createdAt', 'DESC');
  }

  qb.skip(skip).take(limit);
  const [products, total] = await qb.getManyAndCount();

  return {
    products,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getProductBySlug = async (slug: string) => {
  const cacheKey = `product:${slug}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached);

  const product = await productRepo().findOne({
    where: { slug, isActive: true },
    relations: ['images', 'variants', 'variants.inventory', 'category', 'reviews'],
  });
  if (!product) throw new AppError('Product not found', 404);

  await cacheSet(cacheKey, JSON.stringify(product), 300);
  return product;
};

export const getProductById = async (id: string) => {
  const product = await productRepo().findOne({
    where: { id },
    relations: ['images', 'variants', 'variants.inventory', 'category', 'reviews'],
  });
  if (!product) throw new AppError('Product not found', 404);
  return product;
};

export const createProduct = async (data: Partial<Product>) => {
  const slug = data.name!
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const existing = await productRepo().findOneBy({ slug });
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const product = productRepo().create({ ...data, slug: finalSlug });
  return productRepo().save(product);
};

export const updateProduct = async (id: string, data: Partial<Product>) => {
  const product = await productRepo().findOneBy({ id });
  if (!product) throw new AppError('Product not found', 404);
  Object.assign(product, data);
  return productRepo().save(product);
};

export const deleteProduct = async (id: string) => {
  const product = await productRepo().findOneBy({ id });
  if (!product) throw new AppError('Product not found', 404);
  await productRepo().update(id, { isActive: false }); // soft delete
};

export const createVariant = async (productId: string, data: {
  sku: string;
  attributes: Record<string, string>;
  price?: number;
  quantity: number;
  imageUrl?: string;
}) => {
  const product = await productRepo().findOneBy({ id: productId });
  if (!product) throw new AppError('Product not found', 404);

  const variant = variantRepo().create({ productId, ...data });
  await variantRepo().save(variant);

  const inventory = inventoryRepo().create({
    variantId: variant.id,
    quantity: data.quantity,
  });
  await inventoryRepo().save(inventory);
  return variant;
};

export const updateVariantStock = async (variantId: string, data: { quantity?: number; price?: number }) => {
  const variant = await variantRepo().findOne({ where: { id: variantId }, relations: ['inventory'] });
  if (!variant) throw new AppError('Variant not found', 404);

  if (data.price !== undefined) variant.price = data.price;
  if (data.quantity !== undefined) {
    let inventory = await inventoryRepo().findOneBy({ variantId });
    if (!inventory) {
      inventory = inventoryRepo().create({ variantId, quantity: data.quantity });
    } else {
      inventory.quantity = data.quantity;
    }
    await inventoryRepo().save(inventory);
  }

  return variantRepo().save(variant);
};
