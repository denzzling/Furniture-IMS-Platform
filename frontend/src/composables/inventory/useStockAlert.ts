// frontend/src/composables/inventory/useStockAlert.ts

import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { inventoryApi } from '../../services/api/inventory';
import type {
  StockAlert,
  AlertFilters,
} from '../../types/inventory';

export function useStockAlert() {
  const router = useRouter();
  const toast = useToast();

  // State
  const alerts = ref<StockAlert[]>([]);
  const currentAlert = ref<StockAlert | null>(null);
  const summary = ref<any>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Pagination
  const currentPage = ref(1);
  const totalPages = ref(1);
  const totalItems = ref(0);
  const perPage = ref(15);

  // Filters
  const filters = ref<AlertFilters>({
    branch_id: undefined,
    status: 'active',
    alert_type: undefined,
    sort_by: 'created_at',
    sort_order: 'desc',
    per_page: 15,
    page: 1,
  });

  // Computed
  const hasAlerts = computed(() => alerts.value.length > 0);
  const isEmpty = computed(() => alerts.value.length === 0 && !loading.value);
  const activeAlertsCount = computed(() => alerts.value.filter(a => a.status === 'active').length);
  const paginationInfo = computed(() => {
    const start = (currentPage.value - 1) * perPage.value + 1;
    const end = Math.min(currentPage.value * perPage.value, totalItems.value);
    return { start, end, total: totalItems.value };
  });

  /**
   * Fetch alerts
   */
  const fetchAlerts = async (customFilters?: Partial<AlertFilters>) => {
    loading.value = true;
    error.value = null;

    try {
      const params = {
        ...filters.value,
        ...customFilters,
        page: currentPage.value,
        per_page: perPage.value,
      };

      const response = await inventoryApi.getAlerts(params);

      if (response.data.success) {
        alerts.value = response.data.data.data;
        currentPage.value = response.data.data.current_page;
        totalPages.value = response.data.data.last_page;
        totalItems.value = response.data.data.total;
        perPage.value = response.data.data.per_page;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch alerts';
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
   * Fetch single alert
   */
  const fetchAlert = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.getAlert(id);

      if (response.data.success) {
        currentAlert.value = response.data.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch alert';
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
   * Fetch alert summary
   */
  const fetchSummary = async (branchId?: number) => {
    try {
      const response = await inventoryApi.getAlertSummary(branchId);

      if (response.data.success) {
        summary.value = response.data.data;
      }
    } catch (err: any) {
      console.error('Failed to fetch alert summary:', err);
    }
  };

  /**
   * Acknowledge alert
   */
  const acknowledgeAlert = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.acknowledgeAlert(id);

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Alert acknowledged successfully',
          life: 3000,
        });

        return response.data.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to acknowledge alert';
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
   * Resolve alert
   */
  const resolveAlert = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.resolveAlert(id);

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Alert resolved successfully',
          life: 3000,
        });

        return response.data.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to resolve alert';
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
   * Bulk acknowledge alerts
   */
  const bulkAcknowledge = async (alertIds: number[]) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.bulkAcknowledgeAlerts(alertIds);

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: response.data.message || 'Alerts acknowledged successfully',
          life: 3000,
        });

        return true;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to acknowledge alerts';
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
   * Bulk resolve alerts
   */
  const bulkResolve = async (alertIds: number[]) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.bulkResolveAlerts(alertIds);

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: response.data.message || 'Alerts resolved successfully',
          life: 3000,
        });

        return true;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to resolve alerts';
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
   * Generate alerts
   */
  const generateAlerts = async (branchId: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.generateAlerts(branchId);

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: `${response.data.data.alerts_created} alerts generated`,
          life: 3000,
        });

        return response.data.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to generate alerts';
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
   * Delete alert
   */
  const deleteAlert = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.deleteAlert(id);

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Alert deleted successfully',
          life: 3000,
        });

        return true;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete alert';
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
   * Get alert type severity
   */
  const getAlertTypeSeverity = (type: string) => {
    const severityMap: Record<string, string> = {
      low_stock: 'warning',
      out_of_stock: 'danger',
      overstock: 'info',
      reorder_needed: 'warning',
      expired_soon: 'danger',
    };
    return severityMap[type] || 'secondary';
  };

  /**
   * Get alert type label
   */
  const getAlertTypeLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      low_stock: 'Low Stock',
      out_of_stock: 'Out of Stock',
      overstock: 'Overstock',
      reorder_needed: 'Reorder Needed',
      expired_soon: 'Expiring Soon',
    };
    return labelMap[type] || type;
  };

  /**
   * Get alert status severity
   */
  const getStatusSeverity = (status: string) => {
    const severityMap: Record<string, string> = {
      active: 'danger',
      acknowledged: 'warning',
      resolved: 'success',
    };
    return severityMap[status] || 'secondary';
  };

  /**
   * Get alert status label
   */
  const getStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      active: 'Active',
      acknowledged: 'Acknowledged',
      resolved: 'Resolved',
    };
    return labelMap[status] || status;
  };

  /**
   * Apply filters
   */
  const applyFilters = (newFilters: Partial<AlertFilters>) => {
    filters.value = { ...filters.value, ...newFilters };
    currentPage.value = 1;
  };

  /**
   * Reset filters
   */
  const resetFilters = () => {
    filters.value = {
      branch_id: undefined,
      status: 'active',
      alert_type: undefined,
      sort_by: 'created_at',
      sort_order: 'desc',
      per_page: 15,
      page: 1,
    };
    currentPage.value = 1;
  };

  /**
   * Navigate to detail page
   */
  const navigateToDetail = (id: number) => {
    router.push({ name: 'inventory.alerts.detail', params: { id } });
  };

  return {
    // State
    alerts,
    currentAlert,
    summary,
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
    hasAlerts,
    isEmpty,
    activeAlertsCount,
    
    // Methods
    fetchAlerts,
    fetchAlert,
    fetchSummary,
    acknowledgeAlert,
    resolveAlert,
    bulkAcknowledge,
    bulkResolve,
    generateAlerts,
    deleteAlert,
    getAlertTypeSeverity,
    getAlertTypeLabel,
    getStatusSeverity,
    getStatusLabel,
    applyFilters,
    resetFilters,
    navigateToDetail,
  };
}