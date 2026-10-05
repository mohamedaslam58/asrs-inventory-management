import { Controller, Get, Post, Body } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getCategories() {
    return this.categoriesService.findAllWithMetrics();
  }

  @Post()
  async createCategory(@Body() categoryDto: any) {
    return this.categoriesService.create(categoryDto);
  }
}