import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Item } from './entities/item.entity.js';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {}

  async findAll(search?: string): Promise<any[]> {
  const qb = this.itemRepository
    .createQueryBuilder('item')
    .leftJoinAndSelect('Category', 'category', 'category.id = item.categoryId')
    .leftJoinAndSelect('Supplier', 'supplier', 'supplier.id = item.supplierId')
    .select([
      'item.*',
      'category.name AS "category"',
      'supplier.name AS "supplier"',
    ])
    .orderBy('item.id', 'ASC');

  if (search) {
    qb.where(
      'item.name LIKE :search OR item.sku LIKE :search OR item.barcode LIKE :search OR category.name LIKE :search OR supplier.name LIKE :search',
      { search: `%${search}%` },
    );
  }

  return await qb.getRawMany();
}

  async create(createItemDto: Partial<Item>): Promise<Item> {
    const item = this.itemRepository.create(createItemDto);
    return this.itemRepository.save(item);
  }
}