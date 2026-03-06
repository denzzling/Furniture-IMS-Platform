// frontend/src/composables/inventory/useStockAdjustment.ts

import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { inventoryApi } from '../../services/api/inventory';
import type {
  StockAdjustment,
  StockAdjustmentItem,
  AdjustmentFilters,
} from '../../types/inventory';

export function useStockAdjustment() {
  const router = useRouter();
  const toast = useToast();

  // State
  const adjustments = ref<StockAdjustment[]>([]);
  const currentAdjustment = ref<StockAdjustment | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Pagination
  const currentPage = ref(1);
  const totalPages = ref(1);
  const totalItems = ref(0);
  const perPage = ref(15);

  // Filters
  const filters = ref<AdjustmentFilters>({
    branch_id: undefined,
    status: undefined,
    type: undefined,
    start_date: undefined,
    end_date: undefined,
    sort_by: 'created_at',
    sort_order: 'desc',
    per_page: 15,
    page: 1,
  });

  // Computed
  const hasAdjustments = computed(() => adjustments.value.length > 0);
  const isEmpty = computed(() => adjustments.value.length === 0 && !loading.value);
  const paginationInfo = computed(() => {
    const start = (currentPage.value - 1) * perPage.value + 1;
    const end = Math.min(currentPage.value * perPage.value, totalItems.value);
    return { start, end, total: totalItems.value };
  });

  /**
   * Fetch adjustments
   */
  const fetchAdjustments = async (customFilters?: Partial<AdjustmentFilters>) => {
    loading.value = true;
    error.value = null;

    try {
      const params = {
        ...filters.value,
        ...customFilters,
        page: currentPage.value,
        per_page: perPage.value,
      };

      const response = await inventoryApi.getAdjustments(params);

      if (response.data.success) {
        adjustments.value = response.data.data.data;
        currentPage.value = response.data.data.current_page;
        totalPages.value = response.data.data.last_page;
        totalItems.value = response.data.data.total;
        perPage.value = response.data.data.per_page;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch adjustments';
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
   * Fetch single adjustment
   */
  const fetchAdjustment = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.getAdjustment(id);

      if (response.data.success) {
        currentAdjustment.value = response.data.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch adjustment';
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
   * Create adjustment
   */
  const createAdjustment = async (data: Partial<StockAdjustment> & { items: StockAdjustmentItem[] }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.createAdjustment(data);

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: response.data.message || 'Stock adjustment created successfully',
          life: 3000,
        });

        return response.data.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create adjustment';
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
   * Submit adjustment for approval
   */
  const submitAdjustment = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.submitAdjustment(id);

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Adjustment submitted for approval',
          life: 3000,
        });

        return true;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to submit adjustment';
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
   * Approve adjustment
   */
  const approveAdjustment = async (id: number, approvalNotes?: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.approveAdjustment(id, { approval_notes: approvalNotes });

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Adjustment approved and applied successfully',
          life: 3000,
        });

        return response.data.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to approve adjustment';
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
   * Reject adjustment
   */
  const rejectAdjustment = async (id: number, rejectionReason: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.rejectAdjustment(id, { rejection_reason: rejectionReason });

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Adjustment rejected',
          life: 3000,
        });

        return true;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to reject adjustment';
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
   * Get adjustment type options
   */
  const getAdjustmentTypes = () => [
    { label: 'Physical Count', value: 'physical_count' },
    { label: 'Cycle Count', value: 'cycle_count' },
    { label: 'Spot Check', value: 'spot_check' },
    { label: 'Damage', value: 'damage' },
    { label: 'Loss', value: 'loss' },
    { label: 'Found', value: 'found' },
    { label: 'Correction', value: 'correction' },
    { label: 'Write-off', value: 'writeoff' },
  ];

  /**
   * Get adjustment status severity
   */
  const getStatusSeverity = (status: string) => {
    const severityMap: Record<string, string> = {
      draft: 'secondary',
      pending_approval: 'warning',
      approved: 'success',
      rejected: 'danger',
      applied: 'info',
    };
    return severityMap[status] || 'secondary';
  };

  /**
   * Get adjustment status label
   */
  const getStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      draft: 'Draft',
      pending_approval: 'Pending Approval',
      approved: 'Approved',
      rejected: 'Rejected',
      applied: 'Applied',
    };
    return labelMap[status] || status;
  };

  /**
   * Calculate total value difference
   */
  const calculateTotalValueDifference = (items: StockAdjustmentItem[]) => {
    return items.reduce((sum, item) => sum + (item.value_difference || 0), 0);
  };

  /**
   * Apply filters
   */
  const applyFilters = (newFilters: Partial<AdjustmentFilters>) => {
    filters.value = { ...filters.value, ...newFilters };
    currentPage.value = 1;
  };

  /**
   * Reset filters
   */
  const resetFilters = () => {
    filters.value = {
      branch_id: undefined,
      status: undefined,
      type: undefined,
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
    router.push({ name: 'inventory.adjustments.create' });
  };

  /**
   * Navigate to detail page
   */
  const navigateToDetail = (id: number) => {
    router.push({ name: 'inventory.adjustments.detail', params: { id } });
  };

  /**
   * Navigate to approve page
   */
  const navigateToApprove = (id: number) => {
    router.push({ name: 'inventory.adjustments.approve', params: { id } });
  };

  return {
    // State
    adjustments,
    currentAdjustment,
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
    hasAdjustments,
    isEmpty,
    
    // Methods
    fetchAdjustments,
    fetchAdjustment,
    createAdjustment,
    submitAdjustment,
    approveAdjustment,
    rejectAdjustment,
    getAdjustmentTypes,
    getStatusSeverity,
    getStatusLabel,
    calculateTotalValueDifference,
    applyFilters,
    resetFilters,
    navigateToCreate,
    navigateToDetail,
    navigateToApprove,
  };
}