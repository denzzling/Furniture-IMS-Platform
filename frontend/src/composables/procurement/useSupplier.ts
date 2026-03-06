// frontend/src/composables/procurement/useSupplier.ts
import { ref, computed } from 'vue';
import { supplierApi } from '@/services/api/procurement';
import type { Supplier, SupplierPerformance } from '@/types/procurement';
import { useToast } from 'primevue/usetoast';

export function useSupplier() {
  const toast = useToast();
  const suppliers = ref<Supplier[]>([]);
  const currentSupplier = ref<Supplier | null>(null);
  const supplierPerformance = ref<SupplierPerformance | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const activeSuppliers = computed(() => 
    suppliers.value.filter(s => s.status === 'active')
  );

  const topRatedSuppliers = computed(() => 
    [...suppliers.value]
      .filter(s => s.status === 'active')
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10)
  );

  /**
   * Fetch all suppliers with optional filters
   */
  const fetchSuppliers = async (params?: any) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await supplierApi.getAll(params);
      suppliers.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch suppliers';
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
   * Fetch single supplier by ID
   */
  const fetchSupplierById = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await supplierApi.getById(id);
      currentSupplier.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch supplier';
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
   * Create new supplier
   */
  const createSupplier = async (data: Partial<Supplier>) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await supplierApi.create(data);
      suppliers.value.push(response.data);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Supplier created successfully',
        life: 3000
      });
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to create supplier';
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
   * Update existing supplier
   */
  const updateSupplier = async (id: number, data: Partial<Supplier>) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await supplierApi.update(id, data);
      const index = suppliers.value.findIndex(s => s.id === id);
      if (index !== -1) {
        suppliers.value[index] = response.data;
      }
      if (currentSupplier.value?.id === id) {
        currentSupplier.value = response.data;
      }
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Supplier updated successfully',
        life: 3000
      });
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to update supplier';
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
   * Delete supplier
   */
  const deleteSupplier = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await supplierApi.delete(id);
      suppliers.value = suppliers.value.filter(s => s.id !== id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Supplier deleted successfully',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to delete supplier';
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
   * Attach products to supplier
   */
  const attachProducts = async (supplierId: number, productIds: number[]) => {
    loading.value = true;
    error.value = null;
    try {
      await supplierApi.attachProducts(supplierId, productIds);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Products attached successfully',
        life: 3000
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to attach products';
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
   * Get supplier performance metrics
   */
  const getSupplierPerformance = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await supplierApi.getPerformance(id);
      supplierPerformance.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch supplier performance';
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
    suppliers,
    currentSupplier,
    supplierPerformance,
    loading,
    error,
    
    // Computed
    activeSuppliers,
    topRatedSuppliers,
    
    // Methods
    fetchSuppliers,
    fetchSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    attachProducts,
    getSupplierPerformance,
  };
}
