import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface ValuationRow {
  category: string;
  abuDhabi: number;
  dubai: number;
  alAin: number;
  totalValue: number;
}

export interface TurnoverRow {
  category: string;
  cogs90d: number;
  stockValue: number;
  turnsPerYear: number;
}

export interface SlowMovingRow {
  itemId: number;
  item: string;
  units: number;
  valueTiedUp: number;
  noIssuesForDays: string;
}

export interface ForecastRow {
  itemId: number;
  item: string;
  avgDailyUse: number;
  forecastNext30d: number;
  stock: number;
  daysOfCover: number;
  suggestedOrder: number;
}

@Injectable()
export class ReportsService {
  constructor(private readonly dataSource: DataSource) {}

  // 1. Inventory Valuation (AED, weighted cost)
  async getValuation(): Promise<ValuationRow[]> {
    return await this.dataSource.query(`
      SELECT 
        c.name AS category,
        COALESCE(SUM(CASE WHEN w.name ILIKE '%Abu Dhabi%' THEN sl.quantity * i."unitCost" ELSE 0 END), 0)::float AS "abuDhabi",
        COALESCE(SUM(CASE WHEN w.name ILIKE '%Dubai%' THEN sl.quantity * i."unitCost" ELSE 0 END), 0)::float AS "dubai",
        COALESCE(SUM(CASE WHEN w.name ILIKE '%Al Ain%' THEN sl.quantity * i."unitCost" ELSE 0 END), 0)::float AS "alAin",
        COALESCE(SUM(sl.quantity * i."unitCost"), 0)::float AS "totalValue"
      FROM "Category" c
      LEFT JOIN "Item" i ON i."categoryId" = c.id
      LEFT JOIN "StockLevel" sl ON sl."itemId" = i.id
      LEFT JOIN "Warehouse" w ON w.id = sl."warehouseId"
      GROUP BY c.id, c.name
      ORDER BY "totalValue" DESC
    `);
  }

  // 2. Inventory Turnover
  async getTurnover(): Promise<TurnoverRow[]> {
    return await this.dataSource.query(`
      SELECT 
        c.name AS category,
        COALESCE(SUM(ABS(sm.qty) * i."unitCost"), 0)::float AS "cogs90d",
        COALESCE(sv.stock_value, 0)::float AS "stockValue",
        CASE 
          WHEN COALESCE(sv.stock_value, 0) > 0 
          THEN ROUND(((COALESCE(SUM(ABS(sm.qty) * i."unitCost"), 0) * 4) / sv.stock_value)::numeric, 2)::float
          ELSE 0 
        END AS "turnsPerYear"
      FROM "Category" c
      LEFT JOIN "Item" i ON i."categoryId" = c.id
      LEFT JOIN "StockMovement" sm ON sm."itemId" = i.id 
        AND sm.type = 'OUT'
        AND sm."createdAt" >= NOW() - INTERVAL '90 days'
      LEFT JOIN (
        SELECT i."categoryId", SUM(sl.quantity * i."unitCost") AS stock_value
        FROM "Item" i
        JOIN "StockLevel" sl ON sl."itemId" = i.id
        GROUP BY i."categoryId"
      ) sv ON sv."categoryId" = c.id
      GROUP BY c.id, c.name, sv.stock_value
      ORDER BY "stockValue" DESC
    `);
  }

  // 3. Slow-moving items (no issues in 60 days)
  async getSlowMoving(): Promise<SlowMovingRow[]> {
    return await this.dataSource.query(`
      SELECT 
        i.id AS "itemId",
        i.name AS item,
        COALESCE(SUM(sl.quantity), 0)::int AS units,
        COALESCE(SUM(sl.quantity * i."unitCost"), 0)::float AS "valueTiedUp",
        CASE 
          WHEN MAX(sm."createdAt") IS NULL THEN '90+'
          WHEN EXTRACT(DAY FROM (NOW() - MAX(sm."createdAt")))::int >= 90 THEN '90+'
          ELSE EXTRACT(DAY FROM (NOW() - MAX(sm."createdAt")))::text
        END AS "noIssuesForDays"
      FROM "Item" i
      LEFT JOIN "StockLevel" sl ON sl."itemId" = i.id
      LEFT JOIN "StockMovement" sm ON sm."itemId" = i.id 
        AND sm.type = 'OUT'
      GROUP BY i.id, i.name, i."unitCost"
      HAVING COALESCE(SUM(sl.quantity), 0) > 0 
         AND (MAX(sm."createdAt") IS NULL OR MAX(sm."createdAt") <= NOW() - INTERVAL '60 days')
      ORDER BY "valueTiedUp" DESC
    `);
  }

  // 4. Basic demand forecast (weighted 30d/90d usage, top 20 by need)
  async getDemandForecast(): Promise<ForecastRow[]> {
    return await this.dataSource.query(`
      SELECT 
        i.id AS "itemId",
        i.name AS item,
        ROUND((
          ( (COALESCE(SUM(CASE WHEN sm."createdAt" >= NOW() - INTERVAL '30 days' THEN ABS(sm.qty) ELSE 0 END), 0) / 30.0) * 0.6 ) + 
          ( (COALESCE(SUM(CASE WHEN sm."createdAt" >= NOW() - INTERVAL '90 days' THEN ABS(sm.qty) ELSE 0 END), 0) / 90.0) * 0.4 )
        )::numeric, 2)::float AS "avgDailyUse",
        
        ROUND((
          ( (COALESCE(SUM(CASE WHEN sm."createdAt" >= NOW() - INTERVAL '30 days' THEN ABS(sm.qty) ELSE 0 END), 0) / 30.0) * 0.6 ) + 
          ( (COALESCE(SUM(CASE WHEN sm."createdAt" >= NOW() - INTERVAL '90 days' THEN ABS(sm.qty) ELSE 0 END), 0) / 90.0) * 0.4 )
        ) * 30)::int AS "forecastNext30d",
        
        COALESCE(sl_total.total_stock, 0)::int AS stock,
        
        CASE 
          WHEN (
            ( (COALESCE(SUM(CASE WHEN sm."createdAt" >= NOW() - INTERVAL '30 days' THEN ABS(sm.qty) ELSE 0 END), 0) / 30.0) * 0.6 ) + 
            ( (COALESCE(SUM(CASE WHEN sm."createdAt" >= NOW() - INTERVAL '90 days' THEN ABS(sm.qty) ELSE 0 END), 0) / 90.0) * 0.4 )
          ) > 0 
          THEN ROUND((
            COALESCE(sl_total.total_stock, 0) / (
              ( (COALESCE(SUM(CASE WHEN sm."createdAt" >= NOW() - INTERVAL '30 days' THEN ABS(sm.qty) ELSE 0 END), 0) / 30.0) * 0.6 ) + 
              ( (COALESCE(SUM(CASE WHEN sm."createdAt" >= NOW() - INTERVAL '90 days' THEN ABS(sm.qty) ELSE 0 END), 0) / 90.0) * 0.4 )
            )
          )::numeric, 0)::int
          ELSE 999 
        END AS "daysOfCover",
        
        CASE 
          WHEN COALESCE(sl_total.total_stock, 0) < ROUND((
            ( (COALESCE(SUM(CASE WHEN sm."createdAt" >= NOW() - INTERVAL '30 days' THEN ABS(sm.qty) ELSE 0 END), 0) / 30.0) * 0.6 ) + 
            ( (COALESCE(SUM(CASE WHEN sm."createdAt" >= NOW() - INTERVAL '90 days' THEN ABS(sm.qty) ELSE 0 END), 0) / 90.0) * 0.4 )
          ) * 30)::int
          THEN (ROUND((
            ( (COALESCE(SUM(CASE WHEN sm."createdAt" >= NOW() - INTERVAL '30 days' THEN ABS(sm.qty) ELSE 0 END), 0) / 30.0) * 0.6 ) + 
            ( (COALESCE(SUM(CASE WHEN sm."createdAt" >= NOW() - INTERVAL '90 days' THEN ABS(sm.qty) ELSE 0 END), 0) / 90.0) * 0.4 )
          ) * 30)::int - COALESCE(sl_total.total_stock, 0))
          ELSE 0
        END AS "suggestedOrder"
      FROM "Item" i
      LEFT JOIN "StockMovement" sm ON sm."itemId" = i.id 
        AND sm.type = 'OUT'
      LEFT JOIN (
        SELECT "itemId", SUM(quantity) AS total_stock 
        FROM "StockLevel" 
        GROUP BY "itemId"
      ) sl_total ON sl_total."itemId" = i.id
      GROUP BY i.id, i.name, sl_total.total_stock
      ORDER BY "daysOfCover" ASC, stock ASC
      LIMIT 20
    `);
  }
}