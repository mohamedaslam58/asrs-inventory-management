import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  // 1. Create Default Users for each Role
  const users = [
    { email: 'admin@asrs.local', name: 'Super Admin', role: Role.SUPER_ADMIN },
    { email: 'inv_mgr@asrs.local', name: 'Inventory Manager', role: Role.INVENTORY_MANAGER },
    { email: 'wh_mgr@asrs.local', name: 'Warehouse Manager', role: Role.WAREHOUSE_MANAGER },
    { email: 'procurement@asrs.local', name: 'Procurement Officer', role: Role.PROCUREMENT_OFFICER },
    { email: 'storekeeper@asrs.local', name: 'Storekeeper', role: Role.STOREKEEPER },
    { email: 'viewer@asrs.local', name: 'Viewer', role: Role.VIEWER },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, passwordHash },
    });
  }

  // 2. Create Base Category & Warehouse
  const category = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: { name: 'Electronics' },
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { name: 'Main ASRS Hub' },
    update: {},
    create: { name: 'Main ASRS Hub', city: 'Dubai' },
  });

  const supplier = await prisma.supplier.upsert({
    where: { name: 'Global Tech Distribution' },
    update: {},
    create: { name: 'Global Tech Distribution', email: 'sales@globaltech.com' },
  });

  console.log('Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });