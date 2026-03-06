// frontend/src/composables/procurement/useSupplierPayment.ts
import { ref, computed } from 'vue';
import { supplierPaymentApi } from '@/services/api/procurement';
import type { SupplierPayment } from '@/types/procurement';
import { useToast } from 'primevue/usetoast';

export function useSupplierPayment() {
  const toast = useToast();
  const payments = ref<SupplierPayment[]>([]);
  const currentPayment = ref<SupplierPayment | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const pendingApprovalPayments = computed(() =>
    payments.value.filter(p => p.status === 'pending_approval')
  );

  const approvedPayments = computed(() =>
    payments.value.filter(p => ['approved', 'processing'].includes(p.status))
  );

  const completedPayments = computed(() =>
    payments.value.filter(p => p.status === 'completed')
  );

  /**
   * Fetch all payments with optional filters
   */
  const fetchPayments = async (params?: any) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await supplierPaymentApi.getAll(params);
      payments.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch payments';
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
   * Fetch single payment by ID
   */
  const fetchPaymentById = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await supplierPaymentApi.getById(id);
      currentPayment.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch payment';
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
   * Create new payment
   */
  const createPayment = async (data: Partial<SupplierPayment>) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await supplierPaymentApi.create(data);
      payments.value.push(response.data);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Payment created successfully',
        life: 3000
      });
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to create payment';
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
   * Update existing payment
   */
  const updatePayment = async (id: number, data: Partial<SupplierPayment>) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await supplierPaymentApi.update(id, data);
      const index = payments.value.findIndex(p => p.id === id);
      if (index !== -1) {
        payments.value[index] = response.data;
      }
      if (currentPayment.value?.id === id) {
        currentPayment.value = response.data;
      }
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Payment updated successfully',
        life: 3000
      });
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to update payment';
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
   * Approve payment
   */
  const approvePayment = async (id: number, notes?: string) => {
    loading.value = true;
    error.value = null;
    try {
      await supplierPaymentApi.approve(id, notes);
      await fetchPaymentById(id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Payment approved',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to approve payment';
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
   * Reject payment
   */
  const rejectPayment = async (id: number, reason: string) => {
    loading.value = true;
    error.value = null;
    try {
      await supplierPaymentApi.reject(id, reason);
      await fetchPaymentById(id);
      toast.add({
        severity: 'warn',
        summary: 'Rejected',
        detail: 'Payment rejected',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to reject payment';
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
   * Process payment
   */
  const processPayment = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await supplierPaymentApi.process(id);
      await fetchPaymentById(id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Payment processed',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to process payment';
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
    payments,
    currentPayment,
    loading,
    error,

    // Computed
    pendingApprovalPayments,
    approvedPayments,
    completedPayments,

    // Methods
    fetchPayments,
    fetchPaymentById,
    createPayment,
    updatePayment,
    approvePayment,
    rejectPayment,
    processPayment,
  };
}
