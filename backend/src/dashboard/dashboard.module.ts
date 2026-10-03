import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { KpiMetric } from './entities/kpi-metric.entity.js';
import { InventoryItem } from './entities/inventory-item.entity.js';
import { InventoryTransaction } from './entities/inventory-transaction.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KpiMetric,
      InventoryItem,
      InventoryTransaction,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}