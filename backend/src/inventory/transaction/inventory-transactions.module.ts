import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryTransactionsController } from './inventory-transactions.controller.js';
import { InventoryTransactionsService } from './inventory-transactions.service.js';
import { InventoryTransaction } from './entities/inventory-transaction.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryTransaction])],
  controllers: [InventoryTransactionsController],
  providers: [InventoryTransactionsService],
  exports: [InventoryTransactionsService],
})
export class InventoryTransactionsModule {}