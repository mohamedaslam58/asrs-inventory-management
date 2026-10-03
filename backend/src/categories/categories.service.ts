import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity.js';

export interface CategorySummary {
  id: number;
  name: string;
  items: number;
  units: number;
  value: number;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAllWithMetrics(): Promise<CategorySummary[]> {
    const rawMetrics = await this.categoryRepository.query(`
      SELECT 
        c.id AS id,
        c.name AS name,
        COUNT(i.id)::int AS items,
        COALESCE(SUM(i.stock), 0)::int AS units,
        COALESCE(SUM(i.stock * i."unitCost"), 0)::float AS value
      FROM "Category" c
      LEFT JOIN "Item" i ON i."categoryId" = c.id
      GROUP BY c.id, c.name
      ORDER BY c.id ASC
    `);

    return rawMetrics;
  }

  async create(name: string): Promise<Category> {
    const category = this.categoryRepository.create({ name });
    return await this.categoryRepository.save(category);
  }
}