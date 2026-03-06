// frontend/src/composables/inventory/useInventory.ts

import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import type {
  BranchInventory,
  InventorySummary,
  InventoryFilters,
} from '../../types/inventory';
import inventoryApi from '../../services/api/inventory';

export function useInventory() {
  const router = useRouter();
  const toast = useToast();

  // State
  const inventoryItems = ref<BranchInventory[]>([]);
  const currentItem = ref<BranchInventory | null>(null);
  const summary = ref<InventorySummary | null>(null);
  const lowStockItems = ref<BranchInventory[]>([]);
  const branches = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Pagination
  const currentPage = ref(1);
  const totalPages = ref(1);
  const totalItems = ref(0);
  const perPage = ref(15);

  // Filters
  const filters = ref<InventoryFilters>({
    branch_id: undefined,
    stock_status: undefined,
    search: '',
    warehouse_section: undefined,
    low_stock: false,
    out_of_stock: false,
    sort_by: 'created_at',
    sort_order: 'desc',
    per_page: 15,
    page: 1,
  });

  // Computed
  const hasItems = computed(() => inventoryItems.value.length > 0);
  const isEmpty = computed(() => inventoryItems.value.length === 0 && !loading.value);
  const paginationInfo = computed(() => {
    const start = (currentPage.value - 1) * perPage.value + 1;
    const end = Math.min(currentPage.value * perPage.value, totalItems.value);
    return { start, end, total: totalItems.value };
  });

  /**
   * Fetch branches
   */
  const fetchBranches = async () => {
    try {
      const response = await inventoryApi.getBranches();
      
      if (response.data.success) {
        branches.value = response.data.data;
      }
    } catch (err: any) {
      console.error('Failed to fetch branches:', err);
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch branches',
        life: 3000,
      });
    }
  };

  /**
   * Fetch inventory items for a branch
   */
  const fetchInventory = async (branchId: number, customFilters?: Partial<InventoryFilters>) => {
    loading.value = true;
    error.value = null;

    try {
      const params = {
        ...filters.value,
        ...customFilters,
        branch_id: branchId,
        page: currentPage.value,
        per_page: perPage.value,
      };

      const response = await inventoryApi.getBranchInventory(branchId, params);

      if (response.data.success) {
        inventoryItems.value = response.data.data.data;
        currentPage.value = response.data.data.current_page;
        totalPages.value = response.data.data.last_page;
        totalItems.value = response.data.data.total;
        perPage.value = response.data.data.per_page;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch inventory';
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
   * Fetch inventory summary
   */
  const fetchSummary = async (branchId: number) => {
    try {
      const response = await inventoryApi.getInventorySummary(branchId);

      if (response.data.success) {
        summary.value = response.data.data;
      }
    } catch (err: any) {
      console.error('Failed to fetch summary:', err);
    }
  };

  /**
   * Fetch low stock items
   */
  const fetchLowStock = async (branchId: number) => {
    try {
      const response = await inventoryApi.getLowStock(branchId);

      if (response.data.success) {
        lowStockItems.value = response.data.data;
      }
    } catch (err: any) {
      console.error('Failed to fetch low stock items:', err);
    }
  };

  /**
   * Fetch single inventory item
   */
  const fetchItem = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.getInventoryItem(id);

      if (response.data.success) {
        currentItem.value = response.data.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch inventory item';
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
   * Create inventory record
   */
  const createInventory = async (data: Partial<BranchInventory>) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.createInventory(data);

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: response.data.message || 'Inventory record created successfully',
          life: 3000,
        });

        return response.data.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create inventory record';
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
   * Update inventory settings
   */
  const updateInventory = async (id: number, data: Partial<BranchInventory>) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.updateInventory(id, data);

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: response.data.message || 'Inventory updated successfully',
          life: 3000,
        });

        return response.data.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update inventory';
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
   * Delete inventory record
   */
  const deleteInventory = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await inventoryApi.deleteInventory(id);

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Inventory record deleted successfully',
          life: 3000,
        });

        return true;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete inventory';
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
   * Update stock status
   */
  const updateStockStatus = async (id: number) => {
    try {
      const response = await inventoryApi.updateStockStatus(id);

      if (response.data.success) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Stock status updated successfully',
          life: 3000,
        });

        return response.data.data;
      }
    } catch (err: any) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update stock status',
        life: 3000,
      });
      throw err;
    }
  };

  /**
   * Apply filters
   */
  const applyFilters = (newFilters: Partial<InventoryFilters>) => {
    filters.value = { ...filters.value, ...newFilters };
    currentPage.value = 1; // Reset to first page
  };

  /**
   * Reset filters
   */
  const resetFilters = () => {
    filters.value = {
      branch_id: undefined,
      stock_status: undefined,
      search: '',
      warehouse_section: undefined,
      low_stock: false,
      out_of_stock: false,
      sort_by: 'created_at',
      sort_order: 'desc',
      per_page: 15,
      page: 1,
    };
    currentPage.value = 1;
  };

  /**
   * Change page
   */
  const changePage = (page: number) => {
    currentPage.value = page;
  };

  /**
   * Change per page
   */
  const changePerPage = (perPageValue: number) => {
    perPage.value = perPageValue;
    filters.value.per_page = perPageValue;
    currentPage.value = 1;
  };

  /**
   * Navigate to create page
   */
  const navigateToCreate = () => {
    router.push({ name: 'inventory.items.create' });
  };

  /**
   * Navigate to edit page
   */
  const navigateToEdit = (id: number) => {
    router.push({ name: 'inventory.items.edit', params: { id } });
  };

  /**
   * Navigate to detail page
   */
  const navigateToDetail = (id: number) => {
    router.push({ name: 'inventory.items.detail', params: { id } });
  };

  /**
   * Get stock status severity for badges
   */
  const getStockStatusSeverity = (status: string) => {
    const severityMap: Record<string, string> = {
      in_stock: 'success',
      low_stock: 'warning',
      out_of_stock: 'danger',
      discontinued: 'secondary',
      on_order: 'info',
    };
    return severityMap[status] || 'secondary';
  };

  /**
   * Get stock status label
   */
  const getStockStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      in_stock: 'In Stock',
      low_stock: 'Low Stock',
      out_of_stock: 'Out of Stock',
      discontinued: 'Discontinued',
      on_order: 'On Order',
    };
    return labelMap[status] || status;
  };

  /**
   * Check if item is low on stock
   */
  const isLowStock = (item: BranchInventory) => {
    return item.quantity_available <= item.reorder_point && item.quantity_available > 0;
  };

  /**
   * Check if item is out of stock
   */
  const isOutOfStock = (item: BranchInventory) => {
    return item.quantity_available <= 0;
  };

  return {
    // State
    inventoryItems,
    currentItem,
    summary,
    lowStockItems,
    branches,
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
    hasItems,
    isEmpty,
    
    // Methods
    fetchBranches,
    fetchInventory,
    fetchSummary,
    fetchLowStock,
    fetchItem,
    createInventory,
    updateInventory,
    deleteInventory,
    updateStockStatus,
    applyFilters,
    resetFilters,
    changePage,
    changePerPage,
    navigateToCreate,
    navigateToEdit,
    navigateToDetail,
    getStockStatusSeverity,
    getStockStatusLabel,
    isLowStock,
    isOutOfStock,
  };
}