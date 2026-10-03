import { Controller, Get } from '@nestjs/common';
import { WarehousesService } from './warehouses.service.js';

@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  async getWarehouses() {
    return this.warehousesService.findAllWithMetrics();
  }
}