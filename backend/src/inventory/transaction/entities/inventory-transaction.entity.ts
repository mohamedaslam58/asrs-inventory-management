import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('InventoryTransactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'transaction_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  transactionDate: Date;

  @Column({ name: 'transaction_type', type: 'varchar', length: 50 })
  transactionType: string; // 'IN' | 'OUT' | 'TRF'

  @Column({ name: 'item_name', type: 'varchar', length: 255 })
  itemName: string;

  @Column({ type: 'varchar', length: 255 })
  warehouse: string;

  @Column({ type: 'int' })
  quantity: number;
}