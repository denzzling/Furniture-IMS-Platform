// frontend/src/composables/procurement/useRFQ.ts
import { ref, computed } from 'vue';
import { rfqApi } from '@/services/api/procurement';
import type { RequestForQuotation } from '@/types/procurement';
import { useToast } from 'primevue/usetoast';

export function useRFQ() {
  const toast = useToast();
  const rfqs = ref<RequestForQuotation[]>([]);
  const currentRFQ = ref<RequestForQuotation | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const openRFQs = computed(() =>
    rfqs.value.filter(r => ['sent', 'quotes_received', 'under_evaluation'].includes(r.status))
  );

  const draftRFQs = computed(() =>
    rfqs.value.filter(r => r.status === 'draft')
  );

  /**
   * Fetch all RFQs with optional filters
   */
  const fetchRFQs = async (params?: any) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await rfqApi.getAll(params);
      rfqs.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch RFQs';
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
   * Fetch single RFQ by ID
   */
  const fetchRFQById = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await rfqApi.getById(id);
      currentRFQ.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch RFQ';
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
   * Create new RFQ
   */
  const createRFQ = async (data: Partial<RequestForQuotation>) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await rfqApi.create(data);
      rfqs.value.push(response.data);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'RFQ created successfully',
        life: 3000
      });
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to create RFQ';
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
   * Update existing RFQ
   */
  const updateRFQ = async (id: number, data: Partial<RequestForQuotation>) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await rfqApi.update(id, data);
      const index = rfqs.value.findIndex(r => r.id === id);
      if (index !== -1) {
        rfqs.value[index] = response.data;
      }
      if (currentRFQ.value?.id === id) {
        currentRFQ.value = response.data;
      }
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'RFQ updated successfully',
        life: 3000
      });
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to update RFQ';
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
   * Send RFQ to suppliers
   */
  const sendRFQ = async (id: number, supplierIds: number[]) => {
    loading.value = true;
    error.value = null;
    try {
      await rfqApi.send(id, supplierIds);
      await fetchRFQById(id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `RFQ sent to ${supplierIds.length} suppliers`,
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to send RFQ';
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
   * Close RFQ
   */
  const closeRFQ = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await rfqApi.close(id);
      await fetchRFQById(id);
      toast.add({
        severity: 'info',
        summary: 'Closed',
        detail: 'RFQ closed',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to close RFQ';
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
   * Award RFQ to winning quotation
   */
  const awardRFQ = async (id: number, quotationId: number, notes?: string) => {
    loading.value = true;
    error.value = null;
    try {
      await rfqApi.award(id, quotationId, notes);
      await fetchRFQById(id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'RFQ awarded successfully',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to award RFQ';
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
   * Cancel RFQ
   */
  const cancelRFQ = async (id: number, reason: string) => {
    loading.value = true;
    error.value = null;
    try {
      await rfqApi.cancel(id, reason);
      await fetchRFQById(id);
      toast.add({
        severity: 'warn',
        summary: 'Cancelled',
        detail: 'RFQ cancelled',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to cancel RFQ';
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
    rfqs,
    currentRFQ,
    loading,
    error,

    // Computed
    openRFQs,
    draftRFQs,

    // Methods
    fetchRFQs,
    fetchRFQById,
    createRFQ,
    updateRFQ,
    sendRFQ,
    closeRFQ,
    awardRFQ,
    cancelRFQ,
  };
}
