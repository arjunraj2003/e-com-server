import {
  Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, UpdateDateColumn,
} from 'typeorm';
import { ProductVariant } from './ProductVariant';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => ProductVariant, (v) => v.inventory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @Column()
  variantId: string;

  @Column({ default: 0 })
  quantity: number;

  @Column({ default: 0 })
  reservedQuantity: number;

  @Column({ default: 0 })
  lowStockThreshold: number;

  @UpdateDateColumn()
  updatedAt: Date;

  get availableQuantity(): number {
    return this.quantity - this.reservedQuantity;
  }
}
