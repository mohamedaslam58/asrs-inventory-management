import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import type { Item } from '../../items/entities/item.entity.js';

@Entity('AssetAssignment')
export class AssetAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  tag: string;

  @Column({ name: 'itemId', type: 'int' })
  itemId: number;

  @Column({ type: 'text' })
  employee: string;

  @Column({ type: 'text' })
  department: string;

  @Column({ name: 'warehouseId', type: 'int', nullable: true })
  warehouseId: number;

  @CreateDateColumn({ name: 'issuedAt', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  issuedAt: Date;

  @Column({ name: 'returnedAt', type: 'timestamp', nullable: true })
  returnedAt: Date | null;

  @ManyToOne('Item', (item: any) => item.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: Relation<Item>;
}