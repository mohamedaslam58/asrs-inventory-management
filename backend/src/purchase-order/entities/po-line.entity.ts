import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, type Relation } from 'typeorm';
import type { PurchaseOrder } from './purchase-order.entity.js';

@Entity('POLine')
export class POLine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'poId', type: 'int' })
  poId: number;

  @Column({ name: 'itemId', type: 'int' })
  itemId: number;

  @Column({ type: 'int' })
  qty: number;

  @Column({ name: 'unitCost', type: 'numeric', precision: 10, scale: 2 })
  unitCost: number;

  @ManyToOne('PurchaseOrder', (po: any) => po.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'poId' })
  purchaseOrder: Relation<PurchaseOrder>;
}