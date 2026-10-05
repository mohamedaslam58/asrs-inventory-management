import { Controller, Get, Post } from '@nestjs/common';
import { LowStockService } from './low-stock.service.js';

@Controller('low-stock')
export class LowStockController {
  constructor(private readonly lowStockService: LowStockService) {}

  @Get('alerts')
  async getAlerts() {
    return this.lowStockService.getAlerts();
  }

  @Post('create-draft-pos')
  async createDraftPOs() {
    return this.lowStockService.createDraftPOsFromLowStock();
  }
}