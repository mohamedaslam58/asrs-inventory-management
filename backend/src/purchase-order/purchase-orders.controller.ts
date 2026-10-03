import { Controller, Get, Patch, Post, Param, Body } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service.js';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Get()
  async getPurchaseOrders() {
    return this.poService.findAll();
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.poService.updateStatus(Number(id), status);
  }

//   @Post('auto-create')
//   async autoCreateFromLowStock() {
//     return this.poService.autoCreateFromLowStock();
//   }
}