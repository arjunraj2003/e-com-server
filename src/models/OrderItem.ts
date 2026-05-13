import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Order } from './Order';
import { ProductVariant } from './ProductVariant';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: string;

  @ManyToOne(() => ProductVariant, { eager: true })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @Column()
  variantId: string;

  @Column()
  productName: string; // snapshot at time of order

  @Column({ type: 'jsonb', nullable: true })
  variantAttributes: Record<string, string>; // snapshot

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // snapshot at time of order

  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @CreateDateColumn()
  createdAt: Date;
}
