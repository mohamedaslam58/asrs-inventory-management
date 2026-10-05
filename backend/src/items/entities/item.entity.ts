import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity.js';
import { Supplier } from '../../suppliers/entities/supplier.entity.js';

@Entity('Item')
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  sku: string;

  @Column({ type: 'varchar' })
  barcode: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'int', nullable: true })
  categoryId: number;

  // Many-to-One relation with Category
  @ManyToOne(() => Category, (category) => category.id, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'int', nullable: true })
  supplierId: number;

  // Many-to-One relation with Supplier
  @ManyToOne(() => Supplier, (supplier) => supplier.id, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCost: number;

  @Column({ type: 'int', default: 0 })
  reorderPoint: number;

  @Column({ type: 'int', default: 0 })
  reorderQty: number;

  @Column({ type: 'boolean', default: false })
  isAsset: boolean;

  @Column({ type: 'int', default: 0 })
  stock: number;
}