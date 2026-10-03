import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryTransaction } from './entities/inventory-transaction.entity.js';

export interface StockTransactionRow {
  id: number;
  date: string;
  type: string;
  item: string;
  warehouse: string;
  qty: number;
}

@Injectable()
export class InventoryTransactionsService {
  constructor(
    @InjectRepository(InventoryTransaction)
    private readonly transactionRepository: Repository<InventoryTransaction>,
  ) {}

  async findAll(): Promise<{ totalCount: number; data: StockTransactionRow[] }> {
    const [records, count] = await this.transactionRepository.findAndCount({
      order: { transactionDate: 'DESC', id: 'DESC' },
    });

    const data: StockTransactionRow[] = records.map((tx) => ({
      id: tx.id,
      date: new Date(tx.transactionDate).toISOString().split('T')[0],
      type: tx.transactionType,
      item: tx.itemName,
      warehouse: tx.warehouse,
      qty: tx.quantity,
    }));

    return {
      totalCount: count,
      data,
    };
  }

  async create(dto: Partial<InventoryTransaction>): Promise<InventoryTransaction> {
    const transaction = this.transactionRepository.create(dto);
    return await this.transactionRepository.save(transaction);
  }
}