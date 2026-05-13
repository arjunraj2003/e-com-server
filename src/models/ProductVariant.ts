import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Product } from './Product';
import { Inventory } from './Inventory';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (p) => p.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;

  @Column({ unique: true })
  sku: string;

  // e.g. { size: "XL", color: "Red", storage: "128GB" }
  @Column({ type: 'jsonb', default: {} })
  attributes: Record<string, string>;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number; // overrides base price if set

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => Inventory, (inv) => inv.variant, { cascade: true })
  inventory: Inventory;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
