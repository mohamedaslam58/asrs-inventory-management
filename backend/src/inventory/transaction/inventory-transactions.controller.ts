import { Controller, Get, Post, Body } from '@nestjs/common';
import { InventoryTransactionsService } from './inventory-transactions.service.js';
import { InventoryTransaction } from './entities/inventory-transaction.entity.js';

@Controller('stock-transactions')
export class InventoryTransactionsController {
  constructor(
    private readonly transactionsService: InventoryTransactionsService,
  ) {}

  @Get()
  async getTransactions() {
    return this.transactionsService.findAll();
  }

  @Post()
  async createTransaction(@Body() dto: Partial<InventoryTransaction>) {
    return this.transactionsService.create(dto);
  }
}