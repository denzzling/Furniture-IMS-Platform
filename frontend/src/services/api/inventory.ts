// frontend/src/services/api/inventory.ts
import axios from 'axios';

import type {
  BranchInventory,
  StockAdjustment,
  StockTransfer,
  StockAlert,
  InventoryTransaction,
  InventorySummary,
  InventoryFilters,
  AdjustmentFilters,
  TransferFilters,
  AlertFilters,
  TransactionFilters,
  ApiResponse,
  PaginatedResponse,
} from '../../types/inventory';


export const inventoryApi = {
  // ==================== BRANCHES ====================
  
  /**
   * Get all branches
   */
  getBranches(storeId: number) {
    return axios.get<ApiResponse<any[]>>(`/api/stores/${1}/branches`);
  },

  // ==================== BRANCH INVENTORY ====================
  
  /**
   * Get inventory for branch
   */
  getBranchInventory(branchId: number, filters?: InventoryFilters) {
    return axios.get<PaginatedResponse<BranchInventory>>(`api/inventory/branch/${branchId}`, { 
      params: filters 
    });
  },
  
  /**
   * Get inventory summary for branch
   */
  getInventorySummary(branchId: number) {
    return axios.get<ApiResponse<InventorySummary>>(`/api/inventory/branch/${branchId}/summary`);
  },
  
  /**
   * Get low stock items for branch
   */
  getLowStock(branchId: number) {
    return axios.get<ApiResponse<BranchInventory[]>>(`/api/inventory/branch/${branchId}/low-stock`);
  },
  
  /**
   * Get single inventory item
   */
  getInventoryItem(id: number) {
    return axios.get<ApiResponse<BranchInventory>>(`/inventory/items/${id}`);
  },
  
  /**
   * Create inventory record
   */
  createInventory(data: Partial<BranchInventory>) {
    return axios.post<ApiResponse<BranchInventory>>('/inventory/items', data);
  },
  
  /**
   * Update inventory settings
   */
  updateInventory(id: number, data: Partial<BranchInventory>) {
    return axios.put<ApiResponse<BranchInventory>>(`/inventory/items/${id}`, data);
  },
  
  /**
   * Delete inventory record
   */
  deleteInventory(id: number) {
    return axios.delete<ApiResponse<void>>(`/inventory/items/${id}`);
  },
  
  /**
   * Update stock status
   */
  updateStockStatus(id: number) {
    return axios.post<ApiResponse<BranchInventory>>(`/inventory/items/${id}/update-status`);
  },
  
  // ==================== STOCK ADJUSTMENTS ====================
  
  /**
   * Get all adjustments
   */
  getAdjustments(filters?: AdjustmentFilters) {
    return axios.get<PaginatedResponse<StockAdjustment>>('/inventory/adjustments', { 
      params: filters 
    });
  },
  
  /**
   * Get single adjustment
   */
  getAdjustment(id: number) {
    return axios.get<ApiResponse<StockAdjustment>>(`/inventory/adjustments/${id}`);
  },
  
  /**
   * Create adjustment
   */
  createAdjustment(data: Partial<StockAdjustment> & { items: any[] }) {
    return axios.post<ApiResponse<StockAdjustment>>('/inventory/adjustments', data);
  },
  
  /**
   * Submit adjustment for approval
   */
  submitAdjustment(id: number) {
    return axios.post<ApiResponse<void>>(`/inventory/adjustments/${id}/submit`);
  },
  
  /**
   * Approve adjustment
   */
  approveAdjustment(id: number, data?: { approval_notes?: string }) {
    return axios.post<ApiResponse<StockAdjustment>>(`/inventory/adjustments/${id}/approve`, data);
  },
  
  /**
   * Reject adjustment
   */
  rejectAdjustment(id: number, data: { rejection_reason: string }) {
    return axios.post<ApiResponse<void>>(`/inventory/adjustments/${id}/reject`, data);
  },
  
  // ==================== STOCK TRANSFERS ====================
  
  /**
   * Get all transfers
   */
  getTransfers(filters?: TransferFilters) {
    return axios.get<PaginatedResponse<StockTransfer>>('/inventory/transfers', { 
      params: filters 
    });
  },
  
  /**
   * Get single transfer
   */
  getTransfer(id: number) {
    return axios.get<ApiResponse<StockTransfer>>(`/inventory/transfers/${id}`);
  },
  
  /**
   * Create transfer
   */
  createTransfer(data: Partial<StockTransfer> & { items: any[] }) {
    return axios.post<ApiResponse<StockTransfer>>('/inventory/transfers', data);
  },
  
  /**
   * Approve transfer
   */
  approveTransfer(id: number) {
    return axios.post<ApiResponse<StockTransfer>>(`/inventory/transfers/${id}/approve`);
  },
  
  /**
   * Ship transfer
   */
  shipTransfer(id: number, data: {
    vehicle_type?: string;
    driver_name?: string;
    driver_contact?: string;
    tracking_number?: string;
  }) {
    return axios.post<ApiResponse<StockTransfer>>(`/inventory/transfers/${id}/ship`, data);
  },
  
  /**
   * Receive transfer
   */
  receiveTransfer(id: number, data: {
    items: Array<{
      id: number;
      received_quantity: number;
      damaged_quantity?: number;
    }>;
  }) {
    return axios.post<ApiResponse<StockTransfer>>(`/inventory/transfers/${id}/receive`, data);
  },
  
  /**
   * Cancel transfer
   */
  cancelTransfer(id: number, data: { reason: string }) {
    return axios.post<ApiResponse<void>>(`/inventory/transfers/${id}/cancel`, data);
  },
  
  // ==================== STOCK ALERTS ====================
  
  /**
   * Get all alerts
   */
  getAlerts(filters?: AlertFilters) {
    return axios.get<PaginatedResponse<StockAlert>>('/inventory/alerts', { 
      params: filters 
    });
  },
  
  /**
   * Get single alert
   */
  getAlert(id: number) {
    return axios.get<ApiResponse<StockAlert>>(`api/inventory/alerts/${id}`);
  },
  
  /**
   * Get alert summary
   */
  getAlertSummary(branchId?: number) {
    return axios.get<ApiResponse<any>>('api/inventory/alerts/summary', { 
      params: { branch_id: branchId } 
    });
  },
  
  /**
   * Acknowledge alert
   */
  acknowledgeAlert(id: number) {
    return axios.post<ApiResponse<StockAlert>>(`/inventory/alerts/${id}/acknowledge`);
  },
  
  /**
   * Resolve alert
   */
  resolveAlert(id: number) {
    return axios.post<ApiResponse<StockAlert>>(`/inventory/alerts/${id}/resolve`);
  },
  
  /**
   * Bulk acknowledge alerts
   */
  bulkAcknowledgeAlerts(alertIds: number[]) {
    return axios.post<ApiResponse<void>>('/inventory/alerts/bulk-acknowledge', { 
      alert_ids: alertIds 
    });
  },
  
  /**
   * Bulk resolve alerts
   */
  bulkResolveAlerts(alertIds: number[]) {
    return axios.post<ApiResponse<void>>('/inventory/alerts/bulk-resolve', { 
      alert_ids: alertIds 
    });
  },
  
  /**
   * Generate alerts for branch
   */
  generateAlerts(branchId: number) {
    return axios.post<ApiResponse<{ alerts_created: number }>>('/inventory/alerts/generate', { 
      branch_id: branchId 
    });
  },
  
  /**
   * Delete alert
   */
  deleteAlert(id: number) {
    return axios.delete<ApiResponse<void>>(`/inventory/alerts/${id}`);
  },
  
  // ==================== INVENTORY TRANSACTIONS ====================
  
  /**
   * Get all transactions
   */
  getTransactions(filters?: TransactionFilters) {
    return axios.get<PaginatedResponse<InventoryTransaction>>('/inventory/transactions', { 
      params: filters 
    });
  },
  
  /**
   * Get single transaction
   */
  getTransaction(id: number) {
    return axios.get<ApiResponse<InventoryTransaction>>(`/inventory/transactions/${id}`);
  },
  
  /**
   * Get transaction summary
   */
  getTransactionSummary(filters?: TransactionFilters) {
    return axios.get<ApiResponse<any>>('/inventory/transactions/summary', { 
      params: filters 
    });
  },
  
  /**
   * Get product transaction history
   */
  getProductHistory(productId: number, filters?: TransactionFilters) {
    return axios.get<PaginatedResponse<InventoryTransaction>>(
      `/inventory/transactions/product/${productId}`, 
      { params: filters }
    );
  },
  
  /**
   * Export transactions
   */
  exportTransactions(filters?: TransactionFilters) {
    return axios.get<ApiResponse<any>>('/inventory/transactions/export', { 
      params: filters 
    });
  },
  
  /**
   * Get chart data
   */
  getTransactionChartData(filters: TransactionFilters) {
    return axios.get<ApiResponse<any>>('/inventory/transactions/chart', { 
      params: filters 
    });
  },
  
  /**
   * Get recent transactions
   */
  getRecentTransactions(limit = 10) {
    return axios.get<ApiResponse<InventoryTransaction[]>>('/inventory/transactions/recent', { 
      params: { limit } 
    });
  },

  getDashboardStats(limit = 10) {
    return axios.get<ApiResponse<InventoryTransaction[]>>('/api/inventory/dashboard/stats', { 
      params: { limit } 
    });
  },
};

export default inventoryApi;