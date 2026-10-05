import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity.js';
import { Item } from '../items/entities/item.entity.js';

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
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
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

  async autoCreateFromLowStock(): Promise<PurchaseOrder[]> {
    // 1. Fetch items where current stock <= reorderPoint and supplierId is present
    const lowStockItems = await this.itemRepository
      .createQueryBuilder('item')
      .where('item.stock <= item.reorderPoint')
      .andWhere('item.supplierId IS NOT NULL')
      .getMany();

    if (!lowStockItems.length) {
      return [];
    }

    // 2. Find open POs (DRAFT, SENT, APPROVED) to prevent duplicate line generation
    const activePOs = await this.poRepository.find({
      where: {
        status: In(['DRAFT', 'SENT', 'APPROVED']),
      },
      relations: {
        lines: true,
      },
    });

    const activeItemIds = new Set<number>();
    activePOs.forEach((po: any) => {
      po.lines?.forEach((line: any) => {
        if (line.itemId) activeItemIds.add(line.itemId);
      });
    });

    // 3. Filter out items already included in open reorders
    const itemsToReorder = lowStockItems.filter(
      (item) => !activeItemIds.has(item.id),
    );

    if (!itemsToReorder.length) {
      return [];
    }

    // 4. Group items by supplierId
    const supplierGroup = new Map<number, Item[]>();
    for (const item of itemsToReorder) {
      const group = supplierGroup.get(item.supplierId) || [];
      group.push(item);
      supplierGroup.set(item.supplierId, group);
    }

    const createdPOs: PurchaseOrder[] = [];

    // 5. Generate next PO Number sequence matching PO-2026-XXX format
    const totalPOCount = await this.poRepository.count();
    let poSeq = totalPOCount + 1;

    for (const [supplierId, items] of supplierGroup.entries()) {
      const currentYear = new Date().getFullYear();
      const formattedSeq = String(poSeq).padStart(3, '0');
      const poNumber = `PO-${currentYear}-${formattedSeq}`;

      // Build lines/items for Purchase Order
      const lines = items.map((item) => {
        const targetQty = (item.reorderPoint || 1) * 2;
        const reorderQty = Math.max(
          targetQty - Number(item.stock || 0),
          Number(item.reorderPoint || 1),
        );
        const unitCost = Number(item.unitCost || 0);

        return {
          itemId: item.id,
          qty: reorderQty,
          unitCost: unitCost,
          total: reorderQty * unitCost,
          item: { id: item.id },
        };
      });

      // Create new Purchase Order record
      const newPO = this.poRepository.create({
        number: poNumber,
        supplierId,
        status: 'DRAFT',
        auto: true,
        createdAt: new Date(),
        lines: lines as any,
      });

      const savedPO = await this.poRepository.save(newPO);
      createdPOs.push(savedPO);
      poSeq++;
    }

    return createdPOs;
  }
}