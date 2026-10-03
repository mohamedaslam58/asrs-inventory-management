import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity.js';

export interface WarehouseSummary {
  id: number;
  warehouse: string;
  city: string;
  skusStocked: number;
  units: number;
  value: number;
}

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
  ) {}

  async findAllWithMetrics(): Promise<WarehouseSummary[]> {
    const rawMetrics = await this.warehouseRepository.query(`
      SELECT 
  w.id AS id,
  w.name AS warehouse,
  w.city AS city,
  COUNT(i.id)::int AS "skusStocked",
  COALESCE(SUM(i.stock), 0)::int AS units,
  COALESCE(SUM(i.stock * i."unitCost"), 0)::float AS value
FROM "Warehouse" w
LEFT JOIN "Item" i ON i."warehouseId" = w.id
GROUP BY w.id, w.name, w.city
ORDER BY w.id ASC
    `);

    return rawMetrics;
  }
}