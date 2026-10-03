import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { POStatus } from '@prisma/client';

@Injectable()
export class AutoPoService {
  private readonly logger = new Logger(AutoPoService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Trigger every night at 2:00 AM Gulf Standard Time
  @Cron('0 2 * * *', { timeZone: 'Asia/Dubai' })
  async handleNightlyReorder() {
    this.logger.log('Starting automated inventory reorder check...');
    return this.generateAutoPOs();
  }

  async generateAutoPOs() {
    const lowStockItems = await this.prisma.$queryRaw<
      Array<{
        id: number;
        supplierId: number;
        reorderQty: number;
        unitCost: any;
      }>
    >`
      SELECT i.id, i."supplierId", i."reorderQty", i."unitCost"
      FROM "Item" i
      LEFT JOIN "StockLevel" sl ON i.id = sl."itemId"
      WHERE i.id NOT IN (
        SELECT DISTINCT pol."itemId"
        FROM "POLine" pol
        JOIN "PurchaseOrder" po ON pol."poId" = po.id
        WHERE po.status IN ('DRAFT', 'APPROVED', 'SENT')
      )
      GROUP BY i.id
      HAVING COALESCE(SUM(sl.quantity), 0) <= i."reorderPoint"
    `;

    if (lowStockItems.length === 0) return { created: 0 };

    const groupedBySupplier = new Map<number, typeof lowStockItems>();
    for (const item of lowStockItems) {
      const items = groupedBySupplier.get(item.supplierId) || [];
      items.push(item);
      groupedBySupplier.set(item.supplierId, items);
    }

    let posCreated = 0;
    await this.prisma.$transaction(async (tx) => {
      for (const [supplierId, items] of groupedBySupplier.entries()) {
        await tx.purchaseOrder.create({
          data: {
            number: `AUTO-PO-${Date.now()}-${supplierId}`,
            supplierId,
            status: POStatus.DRAFT,
            auto: true,
            lines: {
              create: items.map((it) => ({
                itemId: it.id,
                qty: it.reorderQty,
                unitCost: it.unitCost,
              })),
            },
          },
        });
        posCreated++;
      }
    });

    return { created: posCreated };
  }
}