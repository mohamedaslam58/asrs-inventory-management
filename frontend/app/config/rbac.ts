export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER',
  PROCUREMENT_OFFICER = 'PROCUREMENT_OFFICER',
  STOREKEEPER = 'STOREKEEPER',
  VIEWER = 'VIEWER',
}

export enum Permission {
  // Items & Inventory
  VIEW_ITEMS = 'items:view',
  CREATE_ITEM = 'items:create',
  EDIT_ITEM = 'items:edit',
  DELETE_ITEM = 'items:delete',
  CREATE_CATEGORY = 'category:create',

  // Transactions & Procurement
  CREATE_STOCK_IN = 'stock:in',
  CREATE_STOCK_OUT = 'stock:out',
  CREATE_TRANSFER = 'stock:transfer',
  CREATE_ASSET_ASSIGNMENT = 'asset-assignments:create',
  CREATE_DRAFT_POS = 'pos:create_draft',
  CREATE_SUPPLIER = 'supplier:create',

  // Warehouses
  VIEW_WAREHOUSES = 'warehouses:view',
  MANAGE_WAREHOUSES = 'warehouses:manage',

  // System & Users
  MANAGE_USERS = 'users:manage',
  VIEW_REPORTS = 'reports:view',
}

// Access Matrix Definition
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission), // Full access

  [Role.INVENTORY_MANAGER]: [
    Permission.VIEW_ITEMS,
    Permission.CREATE_ITEM,
    Permission.EDIT_ITEM,
    Permission.DELETE_ITEM,
    Permission.CREATE_CATEGORY,
    Permission.CREATE_STOCK_IN,
    Permission.CREATE_STOCK_OUT,
    Permission.CREATE_TRANSFER,
    Permission.CREATE_ASSET_ASSIGNMENT,
    Permission.CREATE_DRAFT_POS,
    Permission.CREATE_SUPPLIER,
    Permission.VIEW_WAREHOUSES,
    Permission.MANAGE_WAREHOUSES,
    Permission.VIEW_REPORTS,
  ],

  [Role.WAREHOUSE_MANAGER]: [
    Permission.VIEW_ITEMS,
    Permission.EDIT_ITEM,
    Permission.CREATE_CATEGORY,
    Permission.CREATE_STOCK_IN,
    Permission.CREATE_STOCK_OUT,
    Permission.CREATE_TRANSFER,
    Permission.CREATE_ASSET_ASSIGNMENT,
    Permission.VIEW_WAREHOUSES,
    Permission.VIEW_REPORTS,
  ],

  [Role.PROCUREMENT_OFFICER]: [
    Permission.VIEW_ITEMS,
    Permission.CREATE_ITEM,
    Permission.EDIT_ITEM,
    Permission.CREATE_CATEGORY,
    Permission.CREATE_STOCK_IN,
    Permission.CREATE_DRAFT_POS,
    Permission.CREATE_SUPPLIER,
    Permission.VIEW_WAREHOUSES,
    Permission.VIEW_REPORTS,
  ],

  [Role.STOREKEEPER]: [
    Permission.VIEW_ITEMS,
    Permission.CREATE_STOCK_IN,
    Permission.CREATE_STOCK_OUT,
    Permission.CREATE_TRANSFER,
    Permission.CREATE_ASSET_ASSIGNMENT,
    Permission.VIEW_WAREHOUSES,
  ],

  [Role.VIEWER]: [
    Permission.VIEW_ITEMS,
    Permission.VIEW_WAREHOUSES,
    Permission.VIEW_REPORTS,
  ],
};