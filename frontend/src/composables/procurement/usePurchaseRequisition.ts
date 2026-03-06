// frontend/src/composables/procurement/usePurchaseRequisition.ts
import { ref, computed } from 'vue';
import { purchaseRequisitionApi } from '@/services/api/procurement';
import type { PurchaseRequisition } from '@/types/procurement';
import { useToast } from 'primevue/usetoast';

export function usePurchaseRequisition() {
  const toast = useToast();
  const requisitions = ref<PurchaseRequisition[]>([]);
  const currentRequisition = ref<PurchaseRequisition | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const pendingRequisitions = computed(() =>
    requisitions.value.filter(r => 
      ['draft', 'submitted', 'warehouse_approved'].includes(r.status)
    )
  );

  const approvedRequisitions = computed(() =>
    requisitions.value.filter(r => r.status === 'approved')
  );

  /**
   * Fetch all requisitions with optional filters
   */
  const fetchRequisitions = async (params?: any) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await purchaseRequisitionApi.getAll(params);
      requisitions.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch requisitions';
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
   * Fetch single requisition by ID
   */
  const fetchRequisitionById = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await purchaseRequisitionApi.getById(id);
      currentRequisition.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch requisition';
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
   * Create new requisition
   */
  const createRequisition = async (data: Partial<PurchaseRequisition>) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await purchaseRequisitionApi.create(data);
      requisitions.value.push(response.data);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Purchase requisition created successfully',
        life: 3000
      });
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to create requisition';
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
   * Update existing requisition
   */
  const updateRequisition = async (id: number, data: Partial<PurchaseRequisition>) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await purchaseRequisitionApi.update(id, data);
      const index = requisitions.value.findIndex(r => r.id === id);
      if (index !== -1) {
        requisitions.value[index] = response.data;
      }
      if (currentRequisition.value?.id === id) {
        currentRequisition.value = response.data;
      }
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Purchase requisition updated successfully',
        life: 3000
      });
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to update requisition';
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
   * Submit requisition for approval
   */
  const submitRequisition = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await purchaseRequisitionApi.submit(id);
      await fetchRequisitionById(id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Purchase requisition submitted for approval',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to submit requisition';
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
   * Approve requisition
   */
  const approveRequisition = async (id: number, notes?: string) => {
    loading.value = true;
    error.value = null;
    try {
      await purchaseRequisitionApi.approve(id, notes);
      await fetchRequisitionById(id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Purchase requisition approved',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to approve requisition';
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
   * Reject requisition
   */
  const rejectRequisition = async (id: number, reason: string) => {
    loading.value = true;
    error.value = null;
    try {
      await purchaseRequisitionApi.reject(id, reason);
      await fetchRequisitionById(id);
      toast.add({
        severity: 'warn',
        summary: 'Rejected',
        detail: 'Purchase requisition rejected',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to reject requisition';
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
   * Cancel requisition
   */
  const cancelRequisition = async (id: number, reason: string) => {
    loading.value = true;
    error.value = null;
    try {
      await purchaseRequisitionApi.cancel(id, reason);
      await fetchRequisitionById(id);
      toast.add({
        severity: 'warn',
        summary: 'Cancelled',
        detail: 'Purchase requisition cancelled',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to cancel requisition';
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
   * Convert requisition to purchase order
   */
  const convertToPO = async (id: number, data: any) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await purchaseRequisitionApi.convertToPO(id, data);
      await fetchRequisitionById(id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Converted to Purchase Order',
        life: 3000
      });
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to convert to PO';
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
   * Convert requisition to RFQ
   */
  const convertToRFQ = async (id: number, data: any) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await purchaseRequisitionApi.convertToRFQ(id, data);
      await fetchRequisitionById(id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Converted to RFQ',
        life: 3000
      });
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to convert to RFQ';
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
    requisitions,
    currentRequisition,
    loading,
    error,

    // Computed
    pendingRequisitions,
    approvedRequisitions,

    // Methods
    fetchRequisitions,
    fetchRequisitionById,
    createRequisition,
    updateRequisition,
    submitRequisition,
    approveRequisition,
    rejectRequisition,
    cancelRequisition,
    convertToPO,
    convertToRFQ,
  };
}
