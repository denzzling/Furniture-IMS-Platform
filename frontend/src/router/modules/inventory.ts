// frontend/src/router/modules/inventory.ts

import type { RouteRecordRaw } from 'vue-router';

const inventoryRoutes: RouteRecordRaw[] = [
  {
    path: '/inventory',
    component: () => import('../../layouts/InventoryLayout.vue'),
    name: 'inventory',
    redirect: '/inventory/dashboard',
    meta: {
      requiresAuth: true,
      module: 'inventory',
      permission: 'inventory.dashboard.view',
    },
    children: [
      // ==================== DASHBOARD ====================
      {
        path: 'dashboard',
        name: 'inventory.dashboard',
        component: () => import('../../views/system/Inventory/Dashboard/Index.vue'),
        meta: {
          title: 'Inventory Dashboard',
          permission: 'inventory.dashboard.view',
          breadcrumb: [
            { label: 'Inventory', to: '/inventory' },
            { label: 'Dashboard' },
          ],
        },
      },



      // ==================== BRANCH INVENTORY ====================
      {
        path: 'items',
        name: 'inventory.items',
        component: () => import('../../views/system/Inventory/BranchInventory/Index.vue'),
        meta: {
          title: 'Branch Inventory',
          permission: 'inventory.items.view',
          breadcrumb: [
            { label: 'Inventory', to: '/inventory' },
            { label: 'Branch Inventory' },
          ],
        },
      },
      {
        path: 'items/create',
        name: 'inventory.items.create',
        component: () => import('../../views/system/Inventory/BranchInventory/Create.vue'),
        meta: {
          title: 'Create Inventory Record',
          permission: 'inventory.items.create',
          breadcrumb: [
            { label: 'Inventory', to: '/inventory' },
            { label: 'Branch Inventory', to: '/inventory/items' },
            { label: 'Create' },
          ],
        },
      },
      // {
      //   path: 'items/:id',
      //   name: 'inventory.items.detail',
      //   component: () => import('../../views/system/Inventory/BranchInventory/Detail.vue'),
      //   meta: {
      //     title: 'Inventory Details',
      //     permission: 'inventory.items.view',
      //     breadcrumb: [
      //       { label: 'Inventory', to: '/inventory' },
      //       { label: 'Branch Inventory', to: '/inventory/items' },
      //       { label: 'Details' },
      //     ],
      //   },
      // },
      {
        path: 'items/:id/edit',
        name: 'inventory.items.edit',
        component: () => import('../../views/system/Inventory/BranchInventory/Edit.vue'),
        meta: {
          title: 'Edit Inventory',
          permission: 'inventory.items.edit',
          breadcrumb: [
            { label: 'Inventory', to: '/inventory' },
            { label: 'Branch Inventory', to: '/inventory/items' },
            { label: 'Edit' },
          ],
        },
      },

      // ==================== STOCK ADJUSTMENTS ====================
      {
        path: 'adjustments',
        name: 'inventory.adjustments',
        component: () => import('../../views/system/Inventory/StockAdjustment/Index.vue'),
        meta: {
          title: 'Stock Adjustments',
          permission: 'inventory.adjustments.view',
          breadcrumb: [
            { label: 'Inventory', to: '/inventory' },
            { label: 'Stock Adjustments' },
          ],
        },
      },

      // ==================== STOCK TRANSFERS ====================
      {
        path: 'transfers',
        name: 'inventory.transfers',
        component: () => import('../../views/system/Inventory/StockTransfer/Index.vue'),
        meta: {
          title: 'Stock Transfers',
          permission: 'inventory.transfers.view',
          breadcrumb: [
            { label: 'Inventory', to: '/inventory' },
            { label: 'Stock Transfers' },
          ],
        },
      },

      // ==================== STOCK ALERTS ====================
      {
        path: 'alerts',
        name: 'inventory.alerts',
        component: () => import('../../views/system/Inventory/StockAlert/Index.vue'),
        meta: {
          title: 'Stock Alerts',
          permission: 'inventory.alerts.view',
          breadcrumb: [
            { label: 'Inventory', to: '/inventory' },
            { label: 'Stock Alerts' },
          ],
        },
      },
      // ==================== INVENTORY TRANSACTIONS ====================
      // {
      //   path: 'transactions',
      //   name: 'inventory.transactions',
      //   component: () => import('../../views/system/Inventory/Transactions/Index.vue'),
      //   meta: {
      //     title: 'Inventory Transactions',
      //     permission: 'inventory.transactions.view',
      //     breadcrumb: [
      //       { label: 'Inventory', to: '/inventory' },
      //       { label: 'Transactions' },
      //     ],
      //   },
      // },
      // {
      //   path: 'transactions/:id',
      //   name: 'inventory.transactions.detail',
      //   component: () => import('../../views/system/Inventory/Transactions/Detail.vue'),
      //   meta: {
      //     title: 'Transaction Details',
      //     permission: 'inventory.transactions.view',
      //     breadcrumb: [
      //       { label: 'Inventory', to: '/inventory' },
      //       { label: 'Transactions', to: '/inventory/transactions' },
      //       { label: 'Details' },
      //     ],
      //   },
      // },

      // // ==================== REPORTS ====================
      // {
      //   path: 'reports',
      //   name: 'inventory.reports',
      //   component: () => import('../../views/system/Inventory/Reports/Index.vue'),
      //   meta: {
      //     title: 'Inventory Reports',
      //     permission: 'inventory.reports.view',
      //     breadcrumb: [
      //       { label: 'Inventory', to: '/inventory' },
      //       { label: 'Reports' },
      //     ],
      //   },
      // },
    ],
  },
];

export default inventoryRoutes;