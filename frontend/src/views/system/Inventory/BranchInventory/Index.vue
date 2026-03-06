<template>
  <div class="branch-inventory-index p-4">
    <!-- Breadcrumb -->
    <Breadcrumb :home="{ label: 'Dashboard', to: '/inventory' }" :model="breadcrumbItems" class="mb-4" />

    <!-- Page Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">Branch Inventory</h1>
        <p class="text-gray-600 mt-1">Manage inventory levels across all branches</p>
      </div>
      <div class="flex gap-2">
        <Button
          icon="pi pi-refresh"
          label="Refresh"
          severity="secondary"
          outlined
          @click="refreshData"
          :loading="loading"
        />
        <Button
          icon="pi pi-plus"
          label="Add Inventory"
          severity="primary"
          @click="createInventory"
          :disabled="!canCreate"
        />
      </div>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Branch Filter -->
          <div>
            <label for="branch" class="block text-sm font-medium mb-2">Branch</label>
            <Select
              id="branch"
              v-model="filters.branchId"
              :options="branches"
              option-label="name"
              option-value="id"
              placeholder="All Branches"
              show-clear
              class="w-full"
              @change="applyFilters"
            />
          </div>

          <!-- Stock Status Filter -->
          <div>
            <label for="stockStatus" class="block text-sm font-medium mb-2">Stock Status</label>
            <Select
              id="stockStatus"
              v-model="filters.stockStatus"
              :options="stockStatusOptions"
              option-label="label"
              option-value="value"
              placeholder="All Statuses"
              show-clear
              class="w-full"
              @change="applyFilters"
            />
          </div>

          <!-- Search -->
          <div>
            <label for="search" class="block text-sm font-medium mb-2">Search</label>
            <InputText
              id="search"
              v-model="filters.search"
              placeholder="Search by product name or SKU..."
              class="w-full"
              @input="debounceSearch"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Summary Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card class="bg-blue-50 border border-blue-200">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-blue-700 mb-1">Total Products</p>
            <p class="text-2xl font-bold text-blue-900">{{ summaryStats.totalProducts }}</p>
          </div>
        </template>
      </Card>
      <Card class="bg-green-50 border border-green-200">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-green-700 mb-1">In Stock</p>
            <p class="text-2xl font-bold text-green-900">{{ summaryStats.inStock }}</p>
          </div>
        </template>
      </Card>
      <Card class="bg-orange-50 border border-orange-200">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-orange-700 mb-1">Low Stock</p>
            <p class="text-2xl font-bold text-orange-900">{{ summaryStats.lowStock }}</p>
          </div>
        </template>
      </Card>
      <Card class="bg-red-50 border border-red-200">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-red-700 mb-1">Out of Stock</p>
            <p class="text-2xl font-bold text-red-900">{{ summaryStats.outOfStock }}</p>
          </div>
        </template>
      </Card>
    </div>

    <!-- Inventory Table -->
    <InventoryTable
      :loading="loading"
      @edit="editInventory"
      @delete="deleteInventory"
      @view-transactions="viewTransactions"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Breadcrumb from 'primevue/breadcrumb';
import { useToast } from 'primevue/usetoast';

import InventoryTable from '../../../../components/Inventory/Tables/InventoryTable.vue';
import { useInventory } from '../../../../composables/Inventory/useInventory';
import { useInventoryPermissions } from '../../../../composables/Inventory/useInventoryPermissions';

const router = useRouter();
const toast = useToast();
const { branches, fetchInventory } = useInventory();
const { canCreate } = useInventoryPermissions();

// Refs
const loading = ref(false);
const filters = ref({
  branchId: null as number | null,
  stockStatus: null as string | null,
  search: '',
});

const summaryStats = ref({
  totalProducts: 0,
  inStock: 0,
  lowStock: 0,
  outOfStock: 0,
});

// Breadcrumb
const breadcrumbItems = [
  { label: 'Branch Inventory', to: '/inventory/branch' },
];

// Stock status options
const stockStatusOptions = [
  { label: 'In Stock', value: 'in_stock' },
  { label: 'Low Stock', value: 'low_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' },
  { label: 'Overstock', value: 'overstock' },
];

// Debounce timer
let searchDebounce: NodeJS.Timeout;

/**
 * Load data
 */
const loadData = async (): Promise<void> => {
  loading.value = true;
  try {
    await fetchInventory(filters.value);
    await loadSummaryStats();
  } catch (error) {
    console.error('Failed to load inventory:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * Load summary stats
 */
const loadSummaryStats = async (): Promise<void> => {
  // Mock stats - replace with actual API call
  summaryStats.value = {
    totalProducts: 150,
    inStock: 120,
    lowStock: 25,
    outOfStock: 5,
  };
};

/**
 * Apply filters
 */
const applyFilters = (): void => {
  loadData();
};

/**
 * Debounce search
 */
const debounceSearch = (): void => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    applyFilters();
  }, 500);
};

/**
 * Refresh data
 */
const refreshData = (): void => {
  loadData();
};

/**
 * Create inventory
 */
const createInventory = (): void => {
  router.push({ name: 'inventory.branch.create' });
};

/**
 * Edit inventory
 */
const editInventory = (id: number): void => {
  router.push({ name: 'inventory.branch.edit', params: { id } });
};

/**
 * Delete inventory
 */
const deleteInventory = async (id: number): Promise<void> => {
  // TODO: Implement delete with ConfirmDialog
  toast.add({
    severity: 'warn',
    summary: 'Not Implemented',
    detail: 'Delete functionality will be implemented with confirmation dialog',
    life: 3000,
  });
};

/**
 * View transactions
 */
const viewTransactions = (inventoryId: number): void => {
  router.push({ name: 'inventory.transactions', query: { inventoryId } });
};

// Lifecycle
onMounted(() => {
  loadData();
});
</script>
