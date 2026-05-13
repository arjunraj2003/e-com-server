import { AppDataSource } from '../config/data-source';
import { Cart } from '../models/Cart';
import { CartItem } from '../models/CartItem';
import { Inventory } from '../models/Inventory';
import { AppError } from '../middlewares/errorHandler';

const cartRepo = () => AppDataSource.getRepository(Cart);
const cartItemRepo = () => AppDataSource.getRepository(CartItem);
const inventoryRepo = () => AppDataSource.getRepository(Inventory);

const getOrCreateCart = async (userId?: string, sessionId?: string) => {
  if (userId) {
    let cart = await cartRepo().findOne({
      where: { userId },
      relations: ['items', 'items.variant', 'items.variant.product', 'items.variant.inventory'],
    });
    if (!cart) {
      cart = cartRepo().create({ userId });
      await cartRepo().save(cart);
    }
    return cart;
  }
  if (sessionId) {
    let cart = await cartRepo().findOne({
      where: { sessionId },
      relations: ['items', 'items.variant', 'items.variant.product', 'items.variant.inventory'],
    });
    if (!cart) {
      cart = cartRepo().create({ sessionId });
      await cartRepo().save(cart);
    }
    return cart;
  }
  throw new AppError('userId or sessionId required', 400);
};

export const getCart = async (userId?: string, sessionId?: string) => {
  return getOrCreateCart(userId, sessionId);
};

export const addToCart = async (
  variantId: string,
  quantity: number,
  userId?: string,
  sessionId?: string
) => {
  const cart = await getOrCreateCart(userId, sessionId);

  // Check stock
  const inventory = await inventoryRepo().findOneBy({ variantId });
  if (!inventory || inventory.availableQuantity < quantity) {
    throw new AppError('Insufficient stock', 400);
  }

  const existingItem = cart.items?.find((i) => i.variantId === variantId);
  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (inventory.availableQuantity < newQty) throw new AppError('Insufficient stock', 400);
    await cartItemRepo().update(existingItem.id, { quantity: newQty });
  } else {
    const item = cartItemRepo().create({ cartId: cart.id, variantId, quantity });
    await cartItemRepo().save(item);
  }

  return getCart(userId, sessionId);
};

export const updateCartItem = async (itemId: string, quantity: number, cartId: string) => {
  const item = await cartItemRepo().findOneBy({ id: itemId, cartId });
  if (!item) throw new AppError('Cart item not found', 404);

  const inventory = await inventoryRepo().findOneBy({ variantId: item.variantId });
  if (!inventory || inventory.availableQuantity < quantity) {
    throw new AppError('Insufficient stock', 400);
  }

  await cartItemRepo().update(itemId, { quantity });
};

export const removeFromCart = async (itemId: string, cartId: string) => {
  const item = await cartItemRepo().findOneBy({ id: itemId, cartId });
  if (!item) throw new AppError('Cart item not found', 404);
  await cartItemRepo().remove(item);
};

export const mergeCarts = async (userId: string, sessionId: string) => {
  const guestCart = await cartRepo().findOne({
    where: { sessionId },
    relations: ['items'],
  });
  if (!guestCart || !guestCart.items?.length) return;

  const userCart = await getOrCreateCart(userId);
  for (const guestItem of guestCart.items) {
    const existing = userCart.items?.find((i) => i.variantId === guestItem.variantId);
    if (existing) {
      await cartItemRepo().update(existing.id, { quantity: existing.quantity + guestItem.quantity });
    } else {
      const item = cartItemRepo().create({
        cartId: userCart.id,
        variantId: guestItem.variantId,
        quantity: guestItem.quantity,
      });
      await cartItemRepo().save(item);
    }
  }
  await cartRepo().remove(guestCart);
};
