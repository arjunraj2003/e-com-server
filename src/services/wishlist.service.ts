import { AppDataSource } from '../config/data-source';
import { Wishlist } from '../models/Wishlist';
import { Cart } from '../models/Cart';
import { CartItem } from '../models/CartItem';
import { AppError } from '../middlewares/errorHandler';

const wishlistRepo = () => AppDataSource.getRepository(Wishlist);
const cartRepo = () => AppDataSource.getRepository(Cart);
const cartItemRepo = () => AppDataSource.getRepository(CartItem);

export const getWishlist = async (userId: string) => {
  return wishlistRepo().find({
    where: { userId },
    relations: ['variant', 'variant.product', 'variant.product.images', 'variant.inventory'],
  });
};

export const addToWishlist = async (userId: string, variantId: string) => {
  const existing = await wishlistRepo().findOneBy({ userId, variantId });
  if (existing) throw new AppError('Already in wishlist', 409);
  const item = wishlistRepo().create({ userId, variantId });
  return wishlistRepo().save(item);
};

export const removeFromWishlist = async (userId: string, wishlistId: string) => {
  const item = await wishlistRepo().findOneBy({ id: wishlistId, userId });
  if (!item) throw new AppError('Wishlist item not found', 404);
  await wishlistRepo().remove(item);
};

export const moveToCart = async (userId: string, wishlistId: string) => {
  const wish = await wishlistRepo().findOneBy({ id: wishlistId, userId });
  if (!wish) throw new AppError('Wishlist item not found', 404);

  let cart = await cartRepo().findOne({
    where: { userId },
    relations: ['items'],
  });
  if (!cart) {
    cart = cartRepo().create({ userId });
    await cartRepo().save(cart);
  }

  const alreadyInCart = cart.items?.find((i) => i.variantId === wish.variantId);
  if (!alreadyInCart) {
    const ci = cartItemRepo().create({ cartId: cart.id, variantId: wish.variantId, quantity: 1 });
    await cartItemRepo().save(ci);
  }

  await wishlistRepo().remove(wish);
  return { message: 'Moved to cart' };
};
