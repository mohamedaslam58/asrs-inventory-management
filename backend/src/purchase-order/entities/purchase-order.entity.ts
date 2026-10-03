import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Relation } from 'typeorm';
import type { POLine } from './po-line.entity.js';

@Entity('PurchaseOrder')
export class PurchaseOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  number: string;

  @Column({ name: 'supplierId', type: 'int' })
  supplierId: number;

  @Column({ type: 'varchar', length: 20, default: 'Draft' })
  status: string;

  @Column({ type: 'boolean', default: false })
  auto: boolean;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany('POLine', (line: any) => line.purchaseOrder)
  lines: Relation<POLine>[];
}