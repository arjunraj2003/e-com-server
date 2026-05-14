import { Request, Response, NextFunction } from 'express';
import * as ProductService from '../services/product.service';
import { AuthRequest } from '../middlewares/auth';
import { AppDataSource } from '../config/data-source';
import { ProductImage } from '../models/ProductImage';
import { uploadImage } from '../config/cloudinary';

export const listProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ProductService.getProducts(req.query as any);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await ProductService.getProductBySlug(req.params.slug);
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await ProductService.getProductById(req.params.id);
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await ProductService.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await ProductService.updateProduct(req.params.id, req.body);
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ProductService.deleteProduct(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
};

export const createVariant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const variant = await ProductService.createVariant(req.params.productId, req.body);
    res.status(201).json({ success: true, data: variant });
  } catch (err) { next(err); }
};

export const uploadImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    const productImgRepo = AppDataSource.getRepository(ProductImage);
    const productRepo = AppDataSource.getRepository(require('../models/Product').Product);

    // Check if product already has a primary image in the DB
    const existingPrimary = await productImgRepo.findOneBy({ productId: req.params.productId, isPrimary: true });

    const uploaded: ProductImage[] = [];
    for (const file of files) {
      const { url, publicId } = await uploadImage(file.path, 'ecommerce/products');
      const img = productImgRepo.create({
        productId: req.params.productId,
        url,
        publicId,
        // Only mark as primary if no primary exists yet AND it's the first file in this batch
        isPrimary: !existingPrimary && uploaded.length === 0,
      });
      await productImgRepo.save(img);
      uploaded.push(img);
    }

    // Bust the Redis product cache so the next request fetches fresh data
    const { cacheDel } = await import('../config/redis');
    const product = await productRepo.findOneBy({ id: req.params.productId });
    if (product?.slug) await cacheDel(`product:${product.slug}`);

    res.status(201).json({ success: true, data: uploaded });
  } catch (err) { next(err); }
};

export const deleteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageId } = req.params;
    const productImgRepo = AppDataSource.getRepository(ProductImage);
    const image = await productImgRepo.findOneBy({ id: imageId });
    
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    if (image.publicId) {
      const { deleteImage: cloudDelete } = await import('../config/cloudinary');
      await cloudDelete(image.publicId);
    }

    await productImgRepo.remove(image);

    // Bust the Redis product cache
    const { cacheDel } = await import('../config/redis');
    const productRepo = AppDataSource.getRepository(require('../models/Product').Product);
    const product = await productRepo.findOneBy({ id: image.productId });
    if (product?.slug) await cacheDel(`product:${product.slug}`);

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (err) { next(err); }
};

export const updateVariantStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const variant = await ProductService.updateVariantStock(req.params.variantId, req.body);
    res.json({ success: true, data: variant });
  } catch (err) { next(err); }
};
