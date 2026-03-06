// frontend/src/composables/procurement/usePurchaseOrder.ts
import { ref, computed } from 'vue';
import { purchaseOrderApi } from '@/services/api/procurement';
import type { PurchaseOrder } from '@/types/procurement';
import { useToast } from 'primevue/usetoast';

export function usePurchaseOrder() {
  const toast = useToast();
  const purchaseOrders = ref<PurchaseOrder[]>([]);
  const currentPurchaseOrder = ref<PurchaseOrder | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const pendingApprovalOrders = computed(() =>
    purchaseOrders.value.filter(po => 
      ['pending_approval', 'partially_approved'].includes(po.status)
    )
  );

  const ordersPending = computed(() =>
    purchaseOrders.value.filter(po => po.status === 'ordered')
  );

  const overdueOrders = computed(() => {
    const today = new Date();
    return purchaseOrders.value.filter(po => {
      if (po.status === 'ordered' && po.expected_delivery_date) {
        return new Date(po.expected_delivery_date) < today;
      }
      return false;
    });
  });

  /**
   * Fetch all purchase orders with optional filters
   */
  const fetchPurchaseOrders = async (params?: any) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await purchaseOrderApi.getAll(params);
      purchaseOrders.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch purchase orders';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Fetch single purchase order by ID
   */
  const fetchPurchaseOrderById = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await purchaseOrderApi.getById(id);
      currentPurchaseOrder.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch purchase order';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Create new purchase order
   */
  const createPurchaseOrder = async (data: Partial<PurchaseOrder>) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await purchaseOrderApi.create(data);
      purchaseOrders.value.push(response.data);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Purchase order created successfully',
        life: 3000
      });
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to create purchase order';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update existing purchase order
   */
  const updatePurchaseOrder = async (id: number, data: Partial<PurchaseOrder>) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await purchaseOrderApi.update(id, data);
      const index = purchaseOrders.value.findIndex(po => po.id === id);
      if (index !== -1) {
        purchaseOrders.value[index] = response.data;
      }
      if (currentPurchaseOrder.value?.id === id) {
        currentPurchaseOrder.value = response.data;
      }
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Purchase order updated successfully',
        life: 3000
      });
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to update purchase order';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Approve purchase order
   */
  const approvePurchaseOrder = async (id: number, notes?: string) => {
    loading.value = true;
    error.value = null;
    try {
      await purchaseOrderApi.approve(id, notes);
      await fetchPurchaseOrderById(id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Purchase order approved',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to approve purchase order';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Reject purchase order
   */
  const rejectPurchaseOrder = async (id: number, reason: string) => {
    loading.value = true;
    error.value = null;
    try {
      await purchaseOrderApi.reject(id, reason);
      await fetchPurchaseOrderById(id);
      toast.add({
        severity: 'warn',
        summary: 'Rejected',
        detail: 'Purchase order rejected',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to reject purchase order';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Send purchase order to supplier
   */
  const sendToSupplier = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await purchaseOrderApi.sendToSupplier(id);
      await fetchPurchaseOrderById(id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Purchase order sent to supplier',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to send purchase order';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Cancel purchase order
   */
  const cancelPurchaseOrder = async (id: number, reason: string) => {
    loading.value = true;
    error.value = null;
    try {
      await purchaseOrderApi.cancel(id, reason);
      await fetchPurchaseOrderById(id);
      toast.add({
        severity: 'warn',
        summary: 'Cancelled',
        detail: 'Purchase order cancelled',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to cancel purchase order';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Print purchase order
   */
  const printPurchaseOrder = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await purchaseOrderApi.print(id);
      // Create blob link to download
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PO-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Purchase order downloaded',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to print purchase order';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    purchaseOrders,
    currentPurchaseOrder,
    loading,
    error,

    // Computed
    pendingApprovalOrders,
    ordersPending,
    overdueOrders,

    // Methods
    fetchPurchaseOrders,
    fetchPurchaseOrderById,
    createPurchaseOrder,
    updatePurchaseOrder,
    approvePurchaseOrder,
    rejectPurchaseOrder,
    sendToSupplier,
    cancelPurchaseOrder,
    printPurchaseOrder,
  };
}
