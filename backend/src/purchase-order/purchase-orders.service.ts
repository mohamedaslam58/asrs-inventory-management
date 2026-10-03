import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity.js';

export interface PurchaseOrderRow {
  id: number;
  po: string;
  date: string;
  supplier: string;
  lines: number;
  total: number;
  status: string;
}

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepository: Repository<PurchaseOrder>,
  ) {}

  async findAll(): Promise<PurchaseOrderRow[]> {
    const rawData = await this.poRepository.query(`
      SELECT 
        po.id,
        po.number AS po,
        TO_CHAR(po."createdAt", 'YYYY-MM-DD') AS date,
        s.name AS supplier,
        COALESCE(COUNT(poi.id), 0)::int AS lines,
        COALESCE(SUM(poi.qty * poi."unitCost"), 0)::float AS total,
        po.status
      FROM "PurchaseOrder" po
      LEFT JOIN "Supplier" s ON s.id = po."supplierId"
      LEFT JOIN "POLine" poi ON poi."poId" = po.id
      GROUP BY po.id, po.number, po."createdAt", s.name, po.status
      ORDER BY po."createdAt" DESC, po.id DESC
    `);

    return rawData;
  }

  async updateStatus(id: number, status: string): Promise<{ success: boolean }> {
    const po = await this.poRepository.findOne({ where: { id } });
    if (!po) {
      throw new NotFoundException(`Purchase Order #${id} not found`);
    }
    po.status = status;
    await this.poRepository.save(po);
    return { success: true };
  }
}