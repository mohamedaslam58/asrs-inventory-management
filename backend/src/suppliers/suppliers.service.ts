import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity.js';

export interface SupplierRow {
  id: number;
  supplier: string;
  email: string;
  phone: string;
  items: number;
  openPos: number;
  totalPoValue: number;
}

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async findAll(): Promise<SupplierRow[]> {
    const rawData = await this.supplierRepository.query(`
      SELECT 
        s.id,
        s.name AS supplier,
        s.email,
        s.phone,
        COALESCE(items_summary.item_count, 0)::int AS items,
        COALESCE(po_summary.open_pos, 0)::int AS "openPos",
        COALESCE(po_summary.total_po_value, 0)::float AS "totalPoValue"
      FROM "Supplier" s
      LEFT JOIN (
        SELECT 
          "supplierId", 
          COUNT(id) AS item_count
        FROM "Item"
        GROUP BY "supplierId"
      ) items_summary ON items_summary."supplierId" = s.id
      LEFT JOIN (
        SELECT 
          po."supplierId",
          COUNT(DISTINCT CASE WHEN po.status::text ILIKE 'OPEN' THEN po.id END) AS open_pos,
          SUM(poi.qty * poi."unitCost") AS total_po_value
        FROM "PurchaseOrder" po
        LEFT JOIN "POLine" poi ON poi."poId" = po.id
        GROUP BY po."supplierId"
      ) po_summary ON po_summary."supplierId" = s.id
      ORDER BY s.id ASC;
    `);

    return rawData;
  }

  async create(dto: Partial<Supplier>): Promise<Supplier> {
    const supplier = this.supplierRepository.create(dto);
    return await this.supplierRepository.save(supplier);
  }
}