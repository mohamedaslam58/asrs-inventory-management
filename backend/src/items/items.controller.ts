import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ItemsService } from './items.service.js';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get('getItems')
  async getItems(@Query('search') search?: string) {
    return this.itemsService.findAll(search);
  }

  @Post()
  async createItem(@Body() itemDto: any) {
    return this.itemsService.create(itemDto);
  }
}