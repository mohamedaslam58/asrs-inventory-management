import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('InventoryTransactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'transaction_date' })
  transactionDate: Date;

  @Column({ name: 'transaction_type', default: 'OUT' })
  transactionType: string; // 'IN' | 'OUT' | 'TRF'

  @Column({ name: 'item_name' })
  itemName: string;

  @Column()
  warehouse: string;

  @Column({ type: 'int' })
  quantity: number;
}