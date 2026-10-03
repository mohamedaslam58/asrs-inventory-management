# Role-Based Access Control (RBAC) Settings

Here is the structured permission breakdown for the **Automated Storage and Retrieval System - Inventory Management System (ASRS-IMS)** roles and write privileges.

## Write Access Permissions Matrix

| Role | Write Access |
| :--- | :--- |
| **Super Admin** | Everything |
| **Inventory Manager** | Items, categories, suppliers, movements, assignments, POs |
| **Warehouse Manager** | Movements, assignments |
| **Procurement Officer** | Suppliers, POs |
| **Storekeeper** | Movements |
| **Viewer** | Read only |


# ASRS Inventory Management System Context

## Stack
- Backend: NestJS, Prisma ORM, PostgreSQL 16, BullMQ, Redis, JWT (httpOnly Cookies).
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query, shadcn UI.

## Execution Rules
1. Never modify StockLevel.quantity directly without inserting a corresponding StockMovement in a single prisma.$transaction.
2. Quantities in StockMovement must use signed integers (+ for IN/ADJUST-UP, - for OUT/TRANSFER-AWAY).
3. Auto PO triggers via nightly Cron (0 2 * * * - Asia/Dubai).