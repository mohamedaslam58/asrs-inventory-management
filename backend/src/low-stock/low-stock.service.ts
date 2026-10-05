import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { PurchaseOrder } from '../purchase-order/entities/purchase-order.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from '../items/entities/item.entity.js';

export interface LowStockAlertRow {
  itemId: number;
  item: string;
  stock: number;
  reorderPt: number;
  shortfall: number;
  suggestedQty: number;
  supplierId: number;
  supplier: string;
  unitCost: number;
}

@Injectable()
export class LowStockService {
  constructor(
    private readonly dataSource: DataSource,
      @InjectRepository(PurchaseOrder)
      private readonly poRepository: Repository<PurchaseOrder>,
      @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>
    ) {}

  async getAlerts(): Promise<LowStockAlertRow[]> {
    const rawData = await this.itemRepository.query(`
      SELECT 
        i.id AS "itemId",
        i.name AS "item",
        i.stock AS "stock",
        i."reorderPoint" AS "reorderPt",
        (i."reorderPoint" - i.stock) AS "shortfall",
        GREATEST((i."reorderPoint" * 2) - i.stock, i."reorderPoint") AS "suggestedQty",
        i."supplierId" AS "supplierId",
        s.name AS "supplier",
        i."unitCost" AS "unitCost"
      FROM "Item" i
      INNER JOIN "Supplier" s ON s.id = i."supplierId"
      WHERE i.stock <= i."reorderPoint"
        AND i."supplierId" IS NOT NULL
      ORDER BY (i."reorderPoint" - i.stock) DESC
    `);

    return rawData;
  }

  async createDraftPOsFromLowStock(
    itemsToProcess?: LowStockAlertRow[],
  ): Promise<PurchaseOrder[]> {
    let rows = itemsToProcess;

    // 1. If no payload provided, fetch current low stock alerts directly
    if (!rows || rows.length === 0) {
      rows = await this.getAlerts();
    }

    if (!rows.length) {
      return [];
    }

    // 2. Fetch existing open POs (DRAFT, SENT, APPROVED) to avoid creating duplicate lines
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

    // 3. Filter out items that already have open PO lines
    const pendingItems = rows.filter(
      (row) => !activeItemIds.has(row.itemId),
    );

    if (!pendingItems.length) {
      return [];
    }

    // 4. Group items by supplierId
    const supplierMap = new Map<number, LowStockAlertRow[]>();
    for (const item of pendingItems) {
      const list = supplierMap.get(item.supplierId) || [];
      list.push(item);
      supplierMap.set(item.supplierId, list);
    }

    const createdPOs: PurchaseOrder[] = [];

    // 5. Sequential PO Number generation (PO-2026-XXX format)
    const currentPOCount = await this.poRepository.count();
    let poSeq = currentPOCount + 1;
    const currentYear = new Date().getFullYear();

    for (const [supplierId, items] of supplierMap.entries()) {
      const formattedSeq = String(poSeq).padStart(3, '0');
      const poNumber = `PO-${currentYear}-${formattedSeq}`;

      // Build POLine records using UI table values (suggestedQty & unitCost)
      const lines = items.map((row) => {
        const qty = Number(row.suggestedQty || row.shortfall || 1);
        const unitCost = Number(row.unitCost || 0);

        return {
          itemId: row.itemId,
          qty: qty,
          unitCost: unitCost,
          total: qty * unitCost,
          item: { id: row.itemId },
        };
      });

      // Assemble new Purchase Order entity matching DB schema
      const newPO = this.poRepository.create({
        number: poNumber,
        supplierId: supplierId,
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