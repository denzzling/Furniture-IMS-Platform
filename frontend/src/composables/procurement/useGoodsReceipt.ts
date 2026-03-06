// frontend/src/composables/procurement/useGoodsReceipt.ts
import { ref, computed } from 'vue';
import { goodsReceiptApi } from '@/services/api/procurement';
import type { GoodsReceipt } from '@/types/procurement';
import { useToast } from 'primevue/usetoast';

export function useGoodsReceipt() {
  const toast = useToast();
  const receipts = ref<GoodsReceipt[]>([]);
  const currentReceipt = ref<GoodsReceipt | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const unverifiedReceipts = computed(() =>
    receipts.value.filter(r => !r.verified_at)
  );

  const partialReceipts = computed(() =>
    receipts.value.filter(r => r.receipt_status === 'partial')
  );

  const damagedReceipts = computed(() =>
    receipts.value.filter(r => r.receipt_status === 'damaged')
  );

  /**
   * Fetch all goods receipts with optional filters
   */
  const fetchReceipts = async (params?: any) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await goodsReceiptApi.getAll(params);
      receipts.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch goods receipts';
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
   * Fetch single goods receipt by ID
   */
  const fetchReceiptById = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await goodsReceiptApi.getById(id);
      currentReceipt.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch goods receipt';
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
   * Create new goods receipt
   */
  const createReceipt = async (data: Partial<GoodsReceipt>) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await goodsReceiptApi.create(data);
      receipts.value.push(response.data);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Goods receipt created successfully',
        life: 3000
      });
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to create goods receipt';
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
   * Update existing goods receipt
   */
  const updateReceipt = async (id: number, data: Partial<GoodsReceipt>) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await goodsReceiptApi.update(id, data);
      const index = receipts.value.findIndex(r => r.id === id);
      if (index !== -1) {
        receipts.value[index] = response.data;
      }
      if (currentReceipt.value?.id === id) {
        currentReceipt.value = response.data;
      }
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Goods receipt updated successfully',
        life: 3000
      });
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to update goods receipt';
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
   * Verify goods receipt
   */
  const verifyReceipt = async (id: number, notes?: string) => {
    loading.value = true;
    error.value = null;
    try {
      await goodsReceiptApi.verify(id, notes);
      await fetchReceiptById(id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Goods receipt verified',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to verify goods receipt';
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
   * Print goods receipt
   */
  const printReceipt = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await goodsReceiptApi.print(id);
      // Create blob link to download
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `GRN-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Goods receipt downloaded',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to print goods receipt';
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
    receipts,
    currentReceipt,
    loading,
    error,

    // Computed
    unverifiedReceipts,
    partialReceipts,
    damagedReceipts,

    // Methods
    fetchReceipts,
    fetchReceiptById,
    createReceipt,
    updateReceipt,
    verifyReceipt,
    printReceipt,
  };
}
