import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';
import { Item } from '../items/entities/item.entity.js';
import { StockLevel } from './entities/stock-level.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Item, StockLevel])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}