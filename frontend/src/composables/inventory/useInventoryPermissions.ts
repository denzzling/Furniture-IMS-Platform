// frontend/src/composables/inventory/useInventoryPermissions.ts

import { computed } from 'vue';
import { useAuthStore } from '../../stores/auth';

export function useInventoryPermissions() {
  const authStore = useAuthStore();
  
  // Get user permissions
  const userPermissions = computed(() => {
    return authStore.user?.role?.permissions?.map((p: any) => p.name) || [];
  });
  
  // Helper to check permission
  const hasPermission = (permission: string): boolean => {
    return userPermissions.value.includes(permission);
  };
  
  // Helper to check any permission
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(p => userPermissions.value.includes(p));
  };
  
  // Helper to check all permissions
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(p => userPermissions.value.includes(p));
  };
  
  // Dashboard Permissions
  const canViewDashboard = computed(() => hasPermission('inventory.dashboard.view'));
  
  // Branch Inventory Permissions
  const canViewInventory = computed(() => hasPermission('inventory.items.view'));
  const canCreateInventory = computed(() => hasPermission('inventory.items.create'));
  const canEditInventory = computed(() => hasPermission('inventory.items.edit'));
  const canDeleteInventory = computed(() => hasPermission('inventory.items.delete'));
  
  // Stock Adjustment Permissions
  const canViewAdjustments = computed(() => hasPermission('inventory.adjustments.view'));
  const canCreateAdjustments = computed(() => hasPermission('inventory.adjustments.create'));
  const canApproveAdjustments = computed(() => hasPermission('inventory.adjustments.approve'));
  const canRejectAdjustments = computed(() => hasPermission('inventory.adjustments.reject'));
  
  // Stock Transfer Permissions
  const canViewTransfers = computed(() => hasPermission('inventory.transfers.view'));
  const canCreateTransfers = computed(() => hasPermission('inventory.transfers.create'));
  const canApproveTransfers = computed(() => hasPermission('inventory.transfers.approve'));
  const canShipTransfers = computed(() => hasPermission('inventory.transfers.ship'));
  const canReceiveTransfers = computed(() => hasPermission('inventory.transfers.receive'));
  const canCancelTransfers = computed(() => hasPermission('inventory.transfers.cancel'));
  
  // Stock Alert Permissions
  const canViewAlerts = computed(() => hasPermission('inventory.alerts.view'));
  const canAcknowledgeAlerts = computed(() => hasPermission('inventory.alerts.acknowledge'));
  const canResolveAlerts = computed(() => hasPermission('inventory.alerts.resolve'));
  const canGenerateAlerts = computed(() => hasPermission('inventory.alerts.generate'));
  const canDeleteAlerts = computed(() => hasPermission('inventory.alerts.delete'));
  
  // Transaction Permissions
  const canViewTransactions = computed(() => hasPermission('inventory.transactions.view'));
  const canExportTransactions = computed(() => hasPermission('inventory.transactions.export'));
  
  // Report Permissions
  const canViewReports = computed(() => hasPermission('inventory.reports.view'));
  const canExportReports = computed(() => hasPermission('inventory.reports.export'));
  
  // Get user role
  const userRole = computed(() => authStore.user?.role?.name || '');
  const userRoleDisplay = computed(() => authStore.user?.role?.display_name || '');
  
  return {
    // Permission checker utilities
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    userPermissions,
    
    // Dashboard
    canViewDashboard,
    
    // Inventory
    canViewInventory,
    canCreateInventory,
    canEditInventory,
    canDeleteInventory,
    
    // Adjustments
    canViewAdjustments,
    canCreateAdjustments,
    canApproveAdjustments,
    canRejectAdjustments,
    
    // Transfers
    canViewTransfers,
    canCreateTransfers,
    canApproveTransfers,
    canShipTransfers,
    canReceiveTransfers,
    canCancelTransfers,
    
    // Alerts
    canViewAlerts,
    canAcknowledgeAlerts,
    canResolveAlerts,
    canGenerateAlerts,
    canDeleteAlerts,
    
    // Transactions
    canViewTransactions,
    canExportTransactions,
    
    // Reports
    canViewReports,
    canExportReports,
    
    // User info
    userRole,
    userRoleDisplay,
  };
}