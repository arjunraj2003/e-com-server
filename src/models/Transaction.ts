import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Payment } from './Payment';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Payment, (p) => p.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @Column()
  paymentId: string;

  @Column({ nullable: true })
  gatewayPaymentId: string; // Razorpay payment_id

  @Column({ nullable: true })
  gatewaySignature: string; // Razorpay signature

  @Column({ type: 'jsonb', nullable: true })
  rawResponse: Record<string, unknown>; // full Razorpay response

  @Column({ default: 'capture' })
  type: string; // capture | refund

  @CreateDateColumn()
  createdAt: Date;
}
