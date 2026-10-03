import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../items/entities/item.entity.js';

export interface InventoryMatrixRow {
  itemId: number;
  item: string;
  abuDhabi: number;
  dubai: number;
  alAin: number;
  total: number;
  value: number;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {}

  async getLiveInventoryMatrix(): Promise<InventoryMatrixRow[]> {
    const rawMatrix = await this.itemRepository.query(`
      SELECT 
        i.id AS "itemId",
        i.name AS item,
        COALESCE(SUM(CASE WHEN sl."warehouseId" = 1 THEN sl.quantity ELSE 0 END), 0)::int AS "abuDhabi",
        COALESCE(SUM(CASE WHEN sl."warehouseId" = 2 THEN sl.quantity ELSE 0 END), 0)::int AS "dubai",
        COALESCE(SUM(CASE WHEN sl."warehouseId" = 3 THEN sl.quantity ELSE 0 END), 0)::int AS "alAin",
        COALESCE(SUM(sl.quantity), 0)::int AS total,
        COALESCE(SUM(sl.quantity) * i."unitCost", 0)::float AS value
      FROM "Item" i
      LEFT JOIN "StockLevel" sl ON sl."itemId" = i.id
      GROUP BY i.id, i.name, i."unitCost"
      ORDER BY i.id ASC
    `);

    return rawMatrix;
  }
}