import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, BeforeInsert,
} from 'typeorm';
import bcrypt from 'bcryptjs';
import { Address } from './Address';
import { Order } from './Order';
import { Cart } from './Cart';
import { Wishlist } from './Wishlist';
import { Review } from './Review';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true, select: false })
  emailVerificationOtp: string;

  @Column({ nullable: true, type: 'timestamp' })
  emailOtpExpiresAt: Date;

  @Column({ nullable: true, select: false })
  passwordResetToken: string;

  @Column({ nullable: true, type: 'timestamp' })
  passwordResetExpiresAt: Date;

  @Column({ nullable: true, select: false })
  refreshToken: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Address, (addr) => addr.user)
  addresses: Address[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];

  @OneToMany(() => Wishlist, (w) => w.user)
  wishlists: Wishlist[];

  @OneToMany(() => Review, (r) => r.user)
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.passwordHash) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    }
  }

  async comparePassword(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.passwordHash);
  }
}
