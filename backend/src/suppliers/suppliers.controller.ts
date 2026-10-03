import { Controller, Get, Post, Body } from '@nestjs/common';
import { SuppliersService } from './suppliers.service.js';
import { Supplier } from './entities/supplier.entity.js';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  async getSuppliers() {
    return this.suppliersService.findAll();
  }

  @Post()
  async createSupplier(@Body() dto: Partial<Supplier>) {
    return this.suppliersService.create(dto);
  }
}