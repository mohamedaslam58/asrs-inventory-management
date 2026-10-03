import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KpiMetric } from './entities/kpi-metric.entity.js';
import { InventoryItem } from './entities/inventory-item.entity.js';
import { InventoryTransaction } from './entities/inventory-transaction.entity.js';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(KpiMetric)
    private readonly kpiRepository: Repository<KpiMetric>,
    @InjectRepository(InventoryItem)
    private readonly itemRepository: Repository<InventoryItem>,
    @InjectRepository(InventoryTransaction)
    private readonly txRepository: Repository<InventoryTransaction>,
  ) {}

  async getDashboardStats() {
    const metrics = await this.kpiRepository.find();

    const stockByCategory = await this.itemRepository
      .createQueryBuilder('item')
      .select('item.category', 'category')
      .addSelect('SUM(item.currentStock * item.unitPrice)', 'value')
      .groupBy('item.category')
      .getRawMany();

    const stockByWarehouse = await this.itemRepository
      .createQueryBuilder('item')
      .select('item.warehouse', 'warehouse')
      .addSelect('SUM(item.currentStock * item.unitPrice)', 'value')
      .groupBy('item.warehouse')
      .getRawMany();

    const lowStock = await this.itemRepository
      .createQueryBuilder('item')
      .where('item.currentStock <= item.reorderPoint')
      .orderBy('item.currentStock', 'ASC')
      .limit(10)
      .getMany();

    const recentTransactions = await this.txRepository.find({
      order: { transactionDate: 'DESC' },
      take: 10,
    });

    return {
      metrics,
      stockByCategory: stockByCategory.map((c) => ({
        category: c.category,
        value: Number(c.value),
      })),
      stockByWarehouse: stockByWarehouse.map((w) => ({
        warehouse: w.warehouse,
        value: Number(w.value),
      })),
      lowStock,
      recentTransactions,
    };
  }
}