// frontend/src/composables/procurement/useSupplierQuotation.ts
import { ref, computed } from 'vue';
import { supplierQuotationApi } from '@/services/api/procurement';
import type { SupplierQuotation } from '@/types/procurement';
import { useToast } from 'primevue/usetoast';

export function useSupplierQuotation() {
  const toast = useToast();
  const quotations = ref<SupplierQuotation[]>([]);
  const currentQuotation = ref<SupplierQuotation | null>(null);
  const comparisonQuotations = ref<SupplierQuotation[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const submittedQuotations = computed(() =>
    quotations.value.filter(q => ['submitted', 'under_evaluation'].includes(q.status))
  );

  const acceptedQuotations = computed(() =>
    quotations.value.filter(q => q.status === 'accepted')
  );

  /**
   * Fetch all quotations with optional filters
   */
  const fetchQuotations = async (params?: any) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await supplierQuotationApi.getAll(params);
      quotations.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch quotations';
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
   * Fetch single quotation by ID
   */
  const fetchQuotationById = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await supplierQuotationApi.getById(id);
      currentQuotation.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch quotation';
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
   * Create new quotation
   */
  const createQuotation = async (data: Partial<SupplierQuotation>) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await supplierQuotationApi.create(data);
      quotations.value.push(response.data);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Quotation created successfully',
        life: 3000
      });
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to create quotation';
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
   * Update existing quotation
   */
  const updateQuotation = async (id: number, data: Partial<SupplierQuotation>) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await supplierQuotationApi.update(id, data);
      const index = quotations.value.findIndex(q => q.id === id);
      if (index !== -1) {
        quotations.value[index] = response.data;
      }
      if (currentQuotation.value?.id === id) {
        currentQuotation.value = response.data;
      }
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Quotation updated successfully',
        life: 3000
      });
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to update quotation';
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
   * Submit quotation
   */
  const submitQuotation = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await supplierQuotationApi.submit(id);
      await fetchQuotationById(id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Quotation submitted',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to submit quotation';
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
   * Evaluate quotation
   */
  const evaluateQuotation = async (id: number, data: { evaluation_score: number; evaluation_notes?: string }) => {
    loading.value = true;
    error.value = null;
    try {
      await supplierQuotationApi.evaluate(id, data);
      await fetchQuotationById(id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Quotation evaluated',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to evaluate quotation';
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
   * Accept quotation
   */
  const acceptQuotation = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await supplierQuotationApi.accept(id);
      await fetchQuotationById(id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Quotation accepted',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to accept quotation';
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
   * Reject quotation
   */
  const rejectQuotation = async (id: number, reason: string) => {
    loading.value = true;
    error.value = null;
    try {
      await supplierQuotationApi.reject(id, reason);
      await fetchQuotationById(id);
      toast.add({
        severity: 'warn',
        summary: 'Rejected',
        detail: 'Quotation rejected',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to reject quotation';
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
   * Compare quotations for an RFQ
   */
  const compareQuotations = async (rfqId: number) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await supplierQuotationApi.compare(rfqId);
      comparisonQuotations.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to compare quotations';
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
    quotations,
    currentQuotation,
    comparisonQuotations,
    loading,
    error,

    // Computed
    submittedQuotations,
    acceptedQuotations,

    // Methods
    fetchQuotations,
    fetchQuotationById,
    createQuotation,
    updateQuotation,
    submitQuotation,
    evaluateQuotation,
    acceptQuotation,
    rejectQuotation,
    compareQuotations,
  };
}
