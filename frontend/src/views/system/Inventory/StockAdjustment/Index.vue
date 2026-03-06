<template>
  <div class="stock-adjustment-index p-4">
    <!-- Breadcrumb -->
    <Breadcrumb :home="{ label: 'Dashboard', to: '/inventory' }" :model="breadcrumbItems" class="mb-4" />

    <!-- Page Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">Stock Adjustments</h1>
        <p class="text-gray-600 mt-1">Manage inventory adjustments and corrections</p>
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
          label="Create Adjustment"
          severity="primary"
          @click="createAdjustment"
          :disabled="!canAdjust"
        />
      </div>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Branch Filter -->
          <div>
            <label for="branch" class="block text-sm font-medium mb-2">Branch</label>
            <Dropdown
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

          <!-- Type Filter -->
          <div>
            <label for="type" class="block text-sm font-medium mb-2">Adjustment Type</label>
            <Dropdown
              id="type"
              v-model="filters.adjustmentType"
              :options="adjustmentTypes"
              option-label="label"
              option-value="value"
              placeholder="All Types"
              show-clear
              class="w-full"
              @change="applyFilters"
            />
          </div>

          <!-- Date Range -->
          <div>
            <label for="dateFrom" class="block text-sm font-medium mb-2">Date From</label>
            <Calendar
              id="dateFrom"
              v-model="filters.dateFrom"
              placeholder="Select start date"
              show-icon
              class="w-full"
              @date-select="applyFilters"
            />
          </div>

          <div>
            <label for="dateTo" class="block text-sm font-medium mb-2">Date To</label>
            <Calendar
              id="dateTo"
              v-model="filters.dateTo"
              placeholder="Select end date"
              show-icon
              class="w-full"
              @date-select="applyFilters"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card class="bg-yellow-50 border border-yellow-200">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-yellow-700 mb-1">Pending Approval</p>
            <p class="text-2xl font-bold text-yellow-900">{{ stats.pendingApproval }}</p>
          </div>
        </template>
      </Card>
      <Card class="bg-green-50 border border-green-200">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-green-700 mb-1">Approved</p>
            <p class="text-2xl font-bold text-green-900">{{ stats.approved }}</p>
          </div>
        </template>
      </Card>
      <Card class="bg-red-50 border border-red-200">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-red-700 mb-1">Rejected</p>
            <p class="text-2xl font-bold text-red-900">{{ stats.rejected }}</p>
          </div>
        </template>
      </Card>
      <Card class="bg-gray-50 border border-gray-200">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-gray-700 mb-1">Total This Month</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.totalThisMonth }}</p>
          </div>
        </template>
      </Card>
    </div>

    <!-- Tabs -->
    <TabView v-model:activeIndex="activeTab" @tab-change="handleTabChange">
      <TabPanel header="Pending Approval">
        <AdjustmentTable
          :loading="loading"
          :status-filter="'pending'"
          @view="viewAdjustment"
          @approve="approveAdjustment"
          @reject="rejectAdjustment"
        />
      </TabPanel>

      <TabPanel header="All Adjustments">
        <AdjustmentTable
          :loading="loading"
          @view="viewAdjustment"
          @approve="approveAdjustment"
          @reject="rejectAdjustment"
        />
      </TabPanel>
    </TabView>

    <!-- Approval Modal -->
    <AdjustmentApprovalModal
      :visible="showApprovalModal"
      :adjustment="selectedAdjustment"
      :mode="approvalMode"
      @approve="handleApprove"
      @reject="handleReject"
      @close="closeApprovalModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Breadcrumb from 'primevue/breadcrumb';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';

import AdjustmentApprovalModal from '../../../../components/Inventory/Modals/AdjustmentApprovalModal.vue';
import { useInventory } from '../../../../composables/inventory/useInventory';
import { useStockAdjustment } from '../../../../composables/inventory/useStockAdjustment';
import { useInventoryPermissions } from '../../../../composables/inventory/useInventoryPermissions';
import type { StockAdjustment } from '../../../../types/inventory';
import AdjustmentTable from '../../../../components/Inventory/Tables/AdjustmentTable.vue';

const router = useRouter();
const toast = useToast();
const { branches } = useInventory();
const { approveAdjustment: approve, rejectAdjustment: reject } = useStockAdjustment();
const { canAdjust } = useInventoryPermissions();

// Refs
const loading = ref(false);
const activeTab = ref(0);
const showApprovalModal = ref(false);
const selectedAdjustment = ref<StockAdjustment | null>(null);
const approvalMode = ref<'approve' | 'reject'>('approve');

const filters = ref({
  branchId: null as number | null,
  adjustmentType: null as string | null,
  dateFrom: null as Date | null,
  dateTo: null as Date | null,
});

const stats = ref({
  pendingApproval: 0,
  approved: 0,
  rejected: 0,
  totalThisMonth: 0,
});

// Breadcrumb
const breadcrumbItems = [
  { label: 'Stock Adjustments', to: '/inventory/adjustments' },
];

// Adjustment types
const adjustmentTypes = [
  { label: 'Increase', value: 'increase' },
  { label: 'Decrease', value: 'decrease' },
  { label: 'Damage', value: 'damage' },
  { label: 'Lost', value: 'lost' },
  { label: 'Found', value: 'found' },
  { label: 'Return', value: 'return' },
  { label: 'Correction', value: 'correction' },
  { label: 'Cycle Count', value: 'cycle_count' },
  { label: 'Other', value: 'other' },
];

/**
 * Load data
 */
const loadData = async (): Promise<void> => {
  loading.value = true;
  try {
    // Load stats and adjustments
    await loadStats();
  } catch (error) {
    console.error('Failed to load adjustments:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * Load stats
 */
const loadStats = async (): Promise<void> => {
  // Mock stats - replace with actual API call
  stats.value = {
    pendingApproval: 8,
    approved: 42,
    rejected: 3,
    totalThisMonth: 53,
  };
};

/**
 * Apply filters
 */
const applyFilters = (): void => {
  loadData();
};

/**
 * Refresh data
 */
const refreshData = (): void => {
  loadData();
};

/**
 * Handle tab change
 */
const handleTabChange = (): void => {
  loadData();
};

/**
 * Create adjustment
 */
const createAdjustment = (): void => {
  router.push({ name: 'inventory.adjustments.create' });
};

/**
 * View adjustment
 */
const viewAdjustment = (id: number): void => {
  router.push({ name: 'inventory.adjustments.view', params: { id } });
};

/**
 * Approve adjustment
 */
const approveAdjustment = (adjustment: StockAdjustment): void => {
  selectedAdjustment.value = adjustment;
  approvalMode.value = 'approve';
  showApprovalModal.value = true;
};

/**
 * Reject adjustment
 */
const rejectAdjustment = (adjustment: StockAdjustment): void => {
  selectedAdjustment.value = adjustment;
  approvalMode.value = 'reject';
  showApprovalModal.value = true;
};

/**
 * Handle approve
 */
const handleApprove = async (notes: string): Promise<void> => {
  try {
    if (!selectedAdjustment.value) return;
    
    await approve(selectedAdjustment.value.id, notes);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Adjustment approved successfully',
      life: 3000,
    });

    closeApprovalModal();
    loadData();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to approve adjustment',
      life: 5000,
    });
  }
};

/**
 * Handle reject
 */
const handleReject = async (reason: string): Promise<void> => {
  try {
    if (!selectedAdjustment.value) return;
    
    await reject(selectedAdjustment.value.id, reason);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Adjustment rejected successfully',
      life: 3000,
    });

    closeApprovalModal();
    loadData();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to reject adjustment',
      life: 5000,
    });
  }
};

/**
 * Close approval modal
 */
const closeApprovalModal = (): void => {
  showApprovalModal.value = false;
  selectedAdjustment.value = null;
};

// Lifecycle
onMounted(() => {
  loadData();
});
</script>
