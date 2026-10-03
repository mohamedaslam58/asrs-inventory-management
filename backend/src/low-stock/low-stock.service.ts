import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

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
  constructor(private readonly dataSource: DataSource) {}

  async getAlerts(): Promise<LowStockAlertRow[]> {
    const rawData = await this.dataSource.query(`
      SELECT 
        i.id AS "itemId",
        i.name AS item,
        COALESCE(SUM(sl.quantity), 0)::int AS stock,
        COALESCE(i."reorderPoint", 0)::int AS "reorderPt",
        CASE 
          WHEN COALESCE(i."reorderPoint", 0) > COALESCE(SUM(sl.quantity), 0)
          THEN (i."reorderPoint" - COALESCE(SUM(sl.quantity), 0))::int
          ELSE 0
        END AS shortfall,
        CASE 
          WHEN COALESCE(i."reorderPoint", 0) > COALESCE(SUM(sl.quantity), 0)
          THEN GREATEST(
            ROUND((i."reorderPoint" * 1.5) - COALESCE(SUM(sl.quantity), 0))::int,
            (i."reorderPoint" - COALESCE(SUM(sl.quantity), 0))::int
          )
          ELSE 0
        END AS "suggestedQty",
        s.id AS "supplierId",
        s.name AS supplier,
        COALESCE(i."unitCost", 0)::float AS "unitCost"
      FROM "Item" i
      LEFT JOIN "StockLevel" sl ON sl."itemId" = i.id
      LEFT JOIN "Supplier" s ON s.id = i."supplierId"
      GROUP BY i.id, i.name, i."reorderPoint", i."unitCost", s.id, s.name
      HAVING COALESCE(SUM(sl.quantity), 0) < COALESCE(i."reorderPoint", 0)
      ORDER BY shortfall DESC
    `);

    return rawData;
  }

  async createDraftPOs(): Promise<{ createdCount: number; poNumbers: string[] }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const alerts: LowStockAlertRow[] = await this.getAlerts();
      if (alerts.length === 0) {
        return { createdCount: 0, poNumbers: [] };
      }

      const groupedBySupplier = new Map<number, LowStockAlertRow[]>();
      for (const alert of alerts) {
        const list = groupedBySupplier.get(alert.supplierId) || [];
        list.push(alert);
        groupedBySupplier.set(alert.supplierId, list);
      }

      const createdPoNumbers: string[] = [];

      for (const [supplierId, items] of groupedBySupplier.entries()) {
        const poCountResult = await queryRunner.query(
          `SELECT COUNT(*)::int AS count FROM "PurchaseOrder"`,
        );
        const poSeq = (poCountResult[0]?.count || 0) + createdPoNumbers.length + 1;
        const poNumber = `PO-2026-${String(poSeq).padStart(3, '0')}`;

        const poResult = await queryRunner.query(
          `
          INSERT INTO "PurchaseOrder" ("number", "supplierId", status, auto, "createdAt")
          VALUES ($1, $2, 'Draft', true, NOW())
          RETURNING id
        `,
          [poNumber, supplierId],
        );

        const poId = poResult[0].id;

        for (const item of items) {
          await queryRunner.query(
            `
            INSERT INTO "POLine" ("poId", "itemId", qty, "unitCost")
            VALUES ($1, $2, $3, $4)
          `,
            [poId, item.itemId, item.suggestedQty, item.unitCost],
          );
        }

        createdPoNumbers.push(poNumber);
      }

      await queryRunner.commitTransaction();
      return { createdCount: createdPoNumbers.length, poNumbers: createdPoNumbers };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}