import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ type: 'int' })
  categoryId: number;

  @Column({ type: 'int' })
  supplierId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCost: number;

  @Column({ type: 'int', default: 0 })
  reorderPoint: number;

  @Column({ type: 'int', default: 0 })
  reorderQty: number;

  @Column({ type: 'boolean', default: false })
  isAsset: boolean;
}