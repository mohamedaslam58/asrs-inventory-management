import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LowStockController } from './low-stock.controller.js';
import { LowStockService } from './low-stock.service.js';
import { Item } from '../items/entities/item.entity.js';
import { PurchaseOrder } from '../purchase-order/entities/purchase-order.entity.js';
import { POLine } from '../purchase-order/entities/po-line.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, PurchaseOrder, POLine]),
  ],
  controllers: [LowStockController],
  providers: [LowStockService],
  exports: [LowStockService],
})
export class LowStockModule {}