import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KpiMetric } from './dashboard/entities/kpi-metric.entity.js';
import { InventoryItem } from './dashboard/entities/inventory-item.entity.js';
import { InventoryTransaction } from './dashboard/entities/inventory-transaction.entity.js';
import { ItemsModule } from './items/items.module.js';
import { Item } from './items/entities/item.entity.js';
import { CategoriesModule } from './categories/categories.module.js';
import { Category } from './categories/entities/category.entity.js';
import { WarehousesModule } from './warehouse/warehouses.module.js';
import { Warehouse } from './warehouse/entities/warehouse.entity.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { StockLevel } from './inventory/entities/stock-level.entity.js';
import { InventoryTransactionsModule } from './inventory/transaction/inventory-transactions.module.js';
import { InventoryTransaction as InventoryTransactionEntity } from './inventory/transaction/entities/inventory-transaction.entity.js';
import { SuppliersModule } from './suppliers/suppliers.module.js';
import { Supplier } from './suppliers/entities/supplier.entity.js';
import { PurchaseOrdersModule } from './purchase-order/purchase-orders.module.js';
import { PurchaseOrder } from './purchase-order/entities/purchase-order.entity.js';
import { POLine } from './purchase-order/entities/po-line.entity.js';
import { LowStockModule } from './low-stock/low-stock.module.js';
import { AssetAssignment } from './asset-assignment/entities/asset-assignment.entity.js';
import { AssetAssignmentModule } from './asset-assignment/asset-assignment.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { AuditLogModule } from './audit-logs/audit-log.module.js';
import { AuditLog } from './audit-logs/entities/audit-log.entity.js';
import { User } from './user/entities/user.entity.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY || '',
      appSecret: process.env.OBSERVE_APP_SECRET || '',
      serviceId: 'backend',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres', // or 'mssql', 'mysql', etc.
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'asrs',
      password: process.env.DB_PASSWORD || 'asrs_secure_password',
      database: process.env.DB_NAME || 'asrs_db',
      entities: [KpiMetric, InventoryItem, InventoryTransaction, Item, Category, Warehouse, StockLevel, InventoryTransactionEntity, Supplier, PurchaseOrder, POLine, AssetAssignment, AuditLog, User], // or [__dirname + '/**/*.entity{.ts,.js}']
      synchronize: false, // Set to false in production
      autoLoadEntities: true, // Automatically load entities for feature modules
    }),
    PrismaModule,
    AuthModule,
    DashboardModule,
    ItemsModule,
    CategoriesModule,
    WarehousesModule,
    InventoryModule,
    InventoryTransactionsModule,
    SuppliersModule,
    PurchaseOrdersModule,
    LowStockModule,
    AssetAssignmentModule,
    ReportsModule,
    AuditLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
