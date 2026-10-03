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

  async findAll(search?: string): Promise<Item[]> {
    if (search) {
      return this.itemRepository.find({
        where: [
          { name: Like(`%${search}%`) },
          { sku: Like(`%${search}%`) },
          { barcode: Like(`%${search}%`) },
          // { categoryId: Like(`%${search}%`) },
          // { supplierId: Like(`%${search}%`) },
        ],
        order: { id: 'ASC' },
      });
    }
    return this.itemRepository.find({ order: { id: 'ASC' } });
  }

  async create(createItemDto: Partial<Item>): Promise<Item> {
    const item = this.itemRepository.create(createItemDto);
    return this.itemRepository.save(item);
  }
}