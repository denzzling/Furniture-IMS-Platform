// frontend/src/composables/inventory/useStockTransfer.ts

import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { inventoryApi } from '../../services/api/inventory';
import type {
  StockTransfer,
  StockTransferItem,
  TransferFilters,
} from '../../types/inventory';

export function useStockTransfer() {
  const router = useRouter();
  const toast = useToast();

  // State
  const transfers = ref<StockTransfer[]>([]);
  const currentTransfer = ref<StockTransfer | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Pagination
  const currentPage = ref(1);
  const totalPages = ref(1);
  const totalItems = ref(0);
  const perPage = ref(15);

  // Filters
  const filters = ref<TransferFilters>({
    from_branch_id: undefined,
    to_branch_id: undefined,
    status: undefined,
    start_date: undefined,
    end_date: undefined,
    sort_by: 'created_at',
    sort_order: 'desc',
    per_page: 15,
    page: 1,
  });

  // Computed
  const hasTransfers = computed(() => transfers.value.length > 0);
  const isEmpty = computed(() => transfers.value.length === 0 && !loading.value);
  const paginationInfo = computed(() => {
    const start = (currentPage.value - 1) * perPage.value + 1;
    const end = Math.min(currentPage.value * perPage.value, totalItems.value);
    return { start, end, total: totalItems.value };
  });

  /**
   * Fetch transfers
   */
  const fetchTransfers = async (customFilters?: Partial<TransferFilters>) => {
    loading.value = true;
    error.value = null;

    try {
      const params = {
        ...filters.value,
        ...customFilters,
        page: currentPage.value,
        per_page: perPage.value,
      };

      const response = await inventoryApi.getTransfers(params);

      if (response.data.success) {
        transfers.value = response.data.data.data;
        currentPage.value = response.data.data.current_page;
        totalPages.value = response.data.data.last_page;
        totalItems.value = response.data.data.total;
        perPage.value = response.data.data.per_page;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch transfers';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  /**
   * Fetch single transfer
   */
  const fetchTransfer = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.getTransfer(id);

      if (response.data.success) {
        currentTransfer.value = response.data.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch transfer';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  /**
   * Create transfer
   */
  const createTransfer = async (data: Partial<StockTransfer> & { items: StockTransferItem[] }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.createTransfer(data);

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: response.data.message || 'Stock transfer created successfully',
          life: 3000,
        });

        return response.data.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create transfer';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000,
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Approve transfer
   */
  const approveTransfer = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.approveTransfer(id);

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Transfer approved successfully',
          life: 3000,
        });

        return response.data.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to approve transfer';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000,
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Ship transfer
   */
  const shipTransfer = async (id: number, data: {
    vehicle_type?: string;
    driver_name?: string;
    driver_contact?: string;
    tracking_number?: string;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.shipTransfer(id, data);

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Transfer shipped successfully',
          life: 3000,
        });

        return response.data.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to ship transfer';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000,
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Receive transfer
   */
  const receiveTransfer = async (id: number, items: Array<{
    id: number;
    received_quantity: number;
    damaged_quantity?: number;
  }>) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.receiveTransfer(id, { items });

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Transfer received successfully',
          life: 3000,
        });

        return response.data.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to receive transfer';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000,
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Cancel transfer
   */
  const cancelTransfer = async (id: number, reason: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.cancelTransfer(id, { reason });

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Transfer cancelled successfully',
          life: 3000,
        });

        return true;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to cancel transfer';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000,
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get transfer status severity
   */
  const getStatusSeverity = (status: string) => {
    const severityMap: Record<string, string> = {
      draft: 'secondary',
      requested: 'info',
      sender_approved: 'success',
      receiver_acknowledged: 'success',
      pending_finance: 'warning',
      finance_approved: 'success',
      approved: 'success',
      in_transit: 'info',
      received: 'success',
      partially_received: 'warning',
      cancelled: 'danger',
      rejected: 'danger',
    };
    return severityMap[status] || 'secondary';
  };

  /**
   * Get transfer status label
   */
  const getStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      draft: 'Draft',
      requested: 'Requested',
      sender_approved: 'Sender Approved',
      receiver_acknowledged: 'Receiver Acknowledged',
      pending_finance: 'Pending Finance',
      finance_approved: 'Finance Approved',
      approved: 'Approved',
      in_transit: 'In Transit',
      received: 'Received',
      partially_received: 'Partially Received',
      cancelled: 'Cancelled',
      rejected: 'Rejected',
    };
    return labelMap[status] || status;
  };

  /**
   * Calculate total goods value
   */
  const calculateGoodsValue = (items: StockTransferItem[]) => {
    return items.reduce((sum, item) => {
      const quantity = item.approved_quantity || item.requested_quantity;
      return sum + (quantity * (item.unit_value || 0));
    }, 0);
  };

  /**
   * Apply filters
   */
  const applyFilters = (newFilters: Partial<TransferFilters>) => {
    filters.value = { ...filters.value, ...newFilters };
    currentPage.value = 1;
  };

  /**
   * Reset filters
   */
  const resetFilters = () => {
    filters.value = {
      from_branch_id: undefined,
      to_branch_id: undefined,
      status: undefined,
      start_date: undefined,
      end_date: undefined,
      sort_by: 'created_at',
      sort_order: 'desc',
      per_page: 15,
      page: 1,
    };
    currentPage.value = 1;
  };

  /**
   * Navigate to create page
   */
  const navigateToCreate = () => {
    router.push({ name: 'inventory.transfers.create' });
  };

  /**
   * Navigate to detail page
   */
  const navigateToDetail = (id: number) => {
    router.push({ name: 'inventory.transfers.detail', params: { id } });
  };

  /**
   * Navigate to ship page
   */
  const navigateToShip = (id: number) => {
    router.push({ name: 'inventory.transfers.ship', params: { id } });
  };

  /**
   * Navigate to receive page
   */
  const navigateToReceive = (id: number) => {
    router.push({ name: 'inventory.transfers.receive', params: { id } });
  };

  return {
    // State
    transfers,
    currentTransfer,
    loading,
    error,
    
    // Pagination
    currentPage,
    totalPages,
    totalItems,
    perPage,
    paginationInfo,
    
    // Filters
    filters,
    
    // Computed
    hasTransfers,
    isEmpty,
    
    // Methods
    fetchTransfers,
    fetchTransfer,
    createTransfer,
    approveTransfer,
    shipTransfer,
    receiveTransfer,
    cancelTransfer,
    getStatusSeverity,
    getStatusLabel,
    calculateGoodsValue,
    applyFilters,
    resetFilters,
    navigateToCreate,
    navigateToDetail,
    navigateToShip,
    navigateToReceive,
  };
}