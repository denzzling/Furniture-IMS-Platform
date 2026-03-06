// frontend/src/services/api/procurement.ts
import axios from 'axios';
import type {
  Supplier,
  PurchaseRequisition,
  RequestForQuotation,
  SupplierQuotation,
  PurchaseOrder,
  GoodsReceipt,
  SupplierPayment,
  SupplierPerformance,
  ProcurementDashboardStats
} from '../../types/procurement';

// ==================== SUPPLIERS ====================
export const supplierApi = {
  getAll: (params?: any) => axios.get<Supplier[]>('/api/procurement/suppliers', { params }),
  getById: (id: number) => axios.get<Supplier>(`/api/procurement/suppliers/${id}`),
  create: (data: Partial<Supplier>) => axios.post<Supplier>('/api/procurement/suppliers', data),
  update: (id: number, data: Partial<Supplier>) => axios.put<Supplier>(`/api/procurement/suppliers/${id}`, data),
  delete: (id: number) => axios.delete(`/api/procurement/suppliers/${id}`),
  attachProducts: (id: number, productIds: number[]) => axios.post(`/api/procurement/suppliers/${id}/products`, { product_ids: productIds }),
  getPerformance: (id: number) => axios.get<SupplierPerformance>(`/api/procurement/suppliers/${id}/performance`),
};

// ==================== PURCHASE REQUISITIONS ====================
export const purchaseRequisitionApi = {
  getAll: (params?: any) => axios.get<PurchaseRequisition[]>('/api/procurement/purchase-requisitions', { params }),
  getById: (id: number) => axios.get<PurchaseRequisition>(`/api/procurement/purchase-requisitions/${id}`),
  create: (data: Partial<PurchaseRequisition>) => axios.post<PurchaseRequisition>('/api/procurement/purchase-requisitions', data),
  update: (id: number, data: Partial<PurchaseRequisition>) => axios.put<PurchaseRequisition>(`/api/procurement/purchase-requisitions/${id}`, data),
  delete: (id: number) => axios.delete(`/api/procurement/purchase-requisitions/${id}`),
  submit: (id: number) => axios.post(`/api/procurement/purchase-requisitions/${id}/submit`),
  approve: (id: number, notes?: string) => axios.post(`/api/procurement/purchase-requisitions/${id}/approve`, { notes }),
  reject: (id: number, reason: string) => axios.post(`/api/procurement/purchase-requisitions/${id}/reject`, { reason }),
  cancel: (id: number, reason: string) => axios.post(`/api/procurement/purchase-requisitions/${id}/cancel`, { reason }),
  convertToPO: (id: number, data: any) => axios.post(`/api/procurement/purchase-requisitions/${id}/convert-to-po`, data),
  convertToRFQ: (id: number, data: any) => axios.post(`/api/procurement/purchase-requisitions/${id}/convert-to-rfq`, data),
};

// ==================== REQUEST FOR QUOTATIONS ====================
export const rfqApi = {
  getAll: (params?: any) => axios.get<RequestForQuotation[]>('/api/procurement/rfqs', { params }),
  getById: (id: number) => axios.get<RequestForQuotation>(`/api/procurement/rfqs/${id}`),
  create: (data: Partial<RequestForQuotation>) => axios.post<RequestForQuotation>('/api/procurement/rfqs', data),
  update: (id: number, data: Partial<RequestForQuotation>) => axios.put<RequestForQuotation>(`/api/procurement/rfqs/${id}`, data),
  delete: (id: number) => axios.delete(`/api/procurement/rfqs/${id}`),
  send: (id: number, supplierIds: number[]) => axios.post(`/api/procurement/rfqs/${id}/send`, { supplier_ids: supplierIds }),
  close: (id: number) => axios.post(`/api/procurement/rfqs/${id}/close`),
  award: (id: number, quotationId: number, notes?: string) => axios.post(`/api/procurement/rfqs/${id}/award`, { quotation_id: quotationId, notes }),
  cancel: (id: number, reason: string) => axios.post(`/api/procurement/rfqs/${id}/cancel`, { reason }),
};

// ==================== SUPPLIER QUOTATIONS ====================
export const supplierQuotationApi = {
  getAll: (params?: any) => axios.get<SupplierQuotation[]>('/api/procurement/quotations', { params }),
  getById: (id: number) => axios.get<SupplierQuotation>(`/api/procurement/quotations/${id}`),
  create: (data: Partial<SupplierQuotation>) => axios.post<SupplierQuotation>('/api/procurement/quotations', data),
  update: (id: number, data: Partial<SupplierQuotation>) => axios.put<SupplierQuotation>(`/api/procurement/quotations/${id}`, data),
  delete: (id: number) => axios.delete(`/api/procurement/quotations/${id}`),
  submit: (id: number) => axios.post(`/api/procurement/quotations/${id}/submit`),
  evaluate: (id: number, data: { evaluation_score: number; evaluation_notes?: string }) => axios.post(`/api/procurement/quotations/${id}/evaluate`, data),
  accept: (id: number) => axios.post(`/api/procurement/quotations/${id}/accept`),
  reject: (id: number, reason: string) => axios.post(`/api/procurement/quotations/${id}/reject`, { reason }),
  compare: (rfqId: number) => axios.get<SupplierQuotation[]>(`/api/procurement/rfqs/${rfqId}/quotations/compare`),
};

// ==================== PURCHASE ORDERS ====================
export const purchaseOrderApi = {
  getAll: (params?: any) => axios.get<PurchaseOrder[]>('/api/procurement/purchase-orders', { params }),
  getById: (id: number) => axios.get<PurchaseOrder>(`/api/procurement/purchase-orders/${id}`),
  create: (data: Partial<PurchaseOrder>) => axios.post<PurchaseOrder>('/api/procurement/purchase-orders', data),
  update: (id: number, data: Partial<PurchaseOrder>) => axios.put<PurchaseOrder>(`/api/procurement/purchase-orders/${id}`, data),
  delete: (id: number) => axios.delete(`/api/procurement/purchase-orders/${id}`),
  approve: (id: number, notes?: string) => axios.post(`/api/procurement/purchase-orders/${id}/approve`, { notes }),
  reject: (id: number, reason: string) => axios.post(`/api/procurement/purchase-orders/${id}/reject`, { reason }),
  sendToSupplier: (id: number) => axios.post(`/api/procurement/purchase-orders/${id}/send`),
  cancel: (id: number, reason: string) => axios.post(`/api/procurement/purchase-orders/${id}/cancel`, { reason }),
  print: (id: number) => axios.get(`/api/procurement/purchase-orders/${id}/print`, { responseType: 'blob' }),
};

// ==================== GOODS RECEIPTS ====================
export const goodsReceiptApi = {
  getAll: (params?: any) => axios.get<GoodsReceipt[]>('/api/procurement/goods-receipts', { params }),
  getById: (id: number) => axios.get<GoodsReceipt>(`/api/procurement/goods-receipts/${id}`),
  create: (data: Partial<GoodsReceipt>) => axios.post<GoodsReceipt>('/api/procurement/goods-receipts', data),
  update: (id: number, data: Partial<GoodsReceipt>) => axios.put<GoodsReceipt>(`/api/procurement/goods-receipts/${id}`, data),
  delete: (id: number) => axios.delete(`/api/procurement/goods-receipts/${id}`),
  verify: (id: number, notes?: string) => axios.post(`/api/procurement/goods-receipts/${id}/verify`, { notes }),
  print: (id: number) => axios.get(`/api/procurement/goods-receipts/${id}/print`, { responseType: 'blob' }),
};

// ==================== SUPPLIER PAYMENTS ====================
export const supplierPaymentApi = {
  getAll: (params?: any) => axios.get<SupplierPayment[]>('/api/procurement/payments', { params }),
  getById: (id: number) => axios.get<SupplierPayment>(`/api/procurement/payments/${id}`),
  create: (data: Partial<SupplierPayment>) => axios.post<SupplierPayment>('/api/procurement/payments', data),
  update: (id: number, data: Partial<SupplierPayment>) => axios.put<SupplierPayment>(`/api/procurement/payments/${id}`, data),
  delete: (id: number) => axios.delete(`/api/procurement/payments/${id}`),
  approve: (id: number, notes?: string) => axios.post(`/api/procurement/payments/${id}/approve`, { notes }),
  reject: (id: number, reason: string) => axios.post(`/api/procurement/payments/${id}/reject`, { reason }),
  process: (id: number) => axios.post(`/api/procurement/payments/${id}/process`),
};

// ==================== DASHBOARD ====================
export const procurementDashboardApi = {
  getStats: () => axios.get<ProcurementDashboardStats>('/api/procurement/dashboard/stats'),
  getPendingApprovals: () => axios.get('/api/procurement/dashboard/pending-approvals'),
  getRecentActivity: (limit?: number) => axios.get('/api/procurement/dashboard/recent-activity', { params: { limit } }),
};
