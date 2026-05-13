import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, OneToOne, CreateDateColumn, UpdateDateColumn, JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Address } from './Address';
import { Coupon } from './Coupon';
import { OrderItem } from './OrderItem';
import { Payment } from './Payment';
import { Shipment } from './Shipment';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURN_REQUESTED = 'return_requested',
  RETURNED = 'returned',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string; // e.g. ORD-20240101-XXXX

  @ManyToOne(() => User, (u) => u.orders, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => Address, { nullable: true })
  @JoinColumn({ name: 'shippingAddressId' })
  shippingAddress: Address;

  @Column({ nullable: true })
  shippingAddressId: string;

  @ManyToOne(() => Coupon, { nullable: true })
  @JoinColumn({ name: 'couponId' })
  coupon: Coupon;

  @Column({ nullable: true })
  couponId: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToOne(() => Payment, (p) => p.order, { cascade: true })
  payment: Payment;

  @OneToOne(() => Shipment, (s) => s.order, { cascade: true })
  shipment: Shipment;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingCharge: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
