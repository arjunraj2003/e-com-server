import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Address } from '../models/Address';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { ProductImage } from '../models/ProductImage';
import { ProductVariant } from '../models/ProductVariant';
import { Inventory } from '../models/Inventory';
import { Cart } from '../models/Cart';
import { CartItem } from '../models/CartItem';
import { Wishlist } from '../models/Wishlist';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Payment } from '../models/Payment';
import { Transaction } from '../models/Transaction';
import { Coupon } from '../models/Coupon';
import { Review } from '../models/Review';
import { Shipment } from '../models/Shipment';
import { Refund } from '../models/Refund';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecommerce_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: false,
  ssl: process.env.DB_SSLMODE === 'require',          // ← add this
  extra: {
    ssl: {
      rejectUnauthorized: false,                       // ← and this
    },
  },
  entities: [
    User, Address, Category, Product, ProductImage, ProductVariant,
    Inventory, Cart, CartItem, Wishlist, Order, OrderItem,
    Payment, Transaction, Coupon, Review, Shipment, Refund,
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});
