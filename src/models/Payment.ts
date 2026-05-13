import {
  Entity, PrimaryGeneratedColumn, Column, OneToOne,
  OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Order } from './Order';
import { Transaction } from './Transaction';
import { Refund } from './Refund';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Order, (o) => o.payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: string;

  @Column({ default: 'razorpay' })
  gateway: string;

  @Column({ nullable: true })
  gatewayOrderId: string; // Razorpay order_id

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'INR' })
  currency: string;

  @OneToMany(() => Transaction, (t) => t.payment, { cascade: true })
  transactions: Transaction[];

  @OneToMany(() => Refund, (r) => r.payment, { cascade: true })
  refunds: Refund[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
