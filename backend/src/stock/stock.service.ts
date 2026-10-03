import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface MoveDto {
  itemId: number;
  warehouseId?: number;
  fromWarehouseId?: number;
  toWarehouseId?: number;
  qty: number;
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUST';
  reference?: string;
}

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async post(dto: MoveDto, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const legs =
        dto.type === 'TRANSFER'
          ? [
              { wh: dto.fromWarehouseId, d: -dto.qty },
              { wh: dto.toWarehouseId, d: dto.qty },
            ]
          : [{ wh: dto.warehouseId, d: dto.type === 'OUT' ? -dto.qty : dto.qty }];

      for (const { wh, d } of legs) {
        if (!wh) throw new BadRequestException('Warehouse ID is required for movement');

        // Upsert zero baseline row
        await tx.stockLevel.upsert({
          where: { itemId_warehouseId: { itemId: dto.itemId, warehouseId: wh } },
          create: { itemId: dto.itemId, warehouseId: wh, quantity: 0 },
          update: {},
        });

        // Atomic conditional decrement prevents overdrawing
        const updateResult = await tx.stockLevel.updateMany({
          where: {
            itemId: dto.itemId,
            warehouseId: wh,
            quantity: { gte: -d },
          },
          data: { quantity: { increment: d } },
        });

        if (updateResult.count === 0) {
          throw new BadRequestException(
            `Insufficient stock for Item #${dto.itemId} in Warehouse #${wh}`,
          );
        }

        await tx.stockMovement.create({
          data: {
            itemId: dto.itemId,
            warehouseId: wh,
            type: dto.type,
            qty: d,
            reference: dto.reference,
            userId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: `STOCK_${dto.type}`,
          detail: JSON.stringify(dto),
        },
      });

      return { success: true };
    });
  }
}