<template>
  <div class="stock-transfer-index p-4">
    <!-- Breadcrumb -->
    <Breadcrumb :home="{ label: 'Dashboard', to: '/inventory' }" :model="breadcrumbItems" class="mb-4" />

    <!-- Page Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">Stock Transfers</h1>
        <p class="text-gray-600 mt-1">Manage inventory transfers between branches</p>
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
          label="Create Transfer"
          severity="primary"
          @click="createTransfer"
          :disabled="!canTransfer"
        />
      </div>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- From Branch -->
          <div>
            <label for="fromBranch" class="block text-sm font-medium mb-2">From Branch</label>
            <Dropdown
              id="fromBranch"
              v-model="filters.fromBranchId"
              :options="branches"
              option-label="name"
              option-value="id"
              placeholder="All Branches"
              show-clear
              class="w-full"
              @change="applyFilters"
            />
          </div>

          <!-- To Branch -->
          <div>
            <label for="toBranch" class="block text-sm font-medium mb-2">To Branch</label>
            <Dropdown
              id="toBranch"
              v-model="filters.toBranchId"
              :options="branches"
              option-label="name"
              option-value="id"
              placeholder="All Branches"
              show-clear
              class="w-full"
              @change="applyFilters"
            />
          </div>

          <!-- Status -->
          <div>
            <label for="status" class="block text-sm font-medium mb-2">Status</label>
            <Dropdown
              id="status"
              v-model="filters.status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              placeholder="All Statuses"
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
              placeholder="Select date"
              show-icon
              class="w-full"
              @date-select="applyFilters"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <Card class="bg-yellow-50 border border-yellow-200">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-yellow-700 mb-1">Pending</p>
            <p class="text-2xl font-bold text-yellow-900">{{ stats.pending }}</p>
          </div>
        </template>
      </Card>
      <Card class="bg-blue-50 border border-blue-200">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-blue-700 mb-1">In Transit</p>
            <p class="text-2xl font-bold text-blue-900">{{ stats.inTransit }}</p>
          </div>
        </template>
      </Card>
      <Card class="bg-green-50 border border-green-200">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-green-700 mb-1">Completed</p>
            <p class="text-2xl font-bold text-green-900">{{ stats.completed }}</p>
          </div>
        </template>
      </Card>
      <Card class="bg-red-50 border border-red-200">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-red-700 mb-1">Cancelled</p>
            <p class="text-2xl font-bold text-red-900">{{ stats.cancelled }}</p>
          </div>
        </template>
      </Card>
      <Card class="bg-purple-50 border border-purple-200">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-purple-700 mb-1">This Month</p>
            <p class="text-2xl font-bold text-purple-900">{{ stats.thisMonth }}</p>
          </div>
        </template>
      </Card>
    </div>

    <!-- Tabs -->
    <TabView v-model:activeIndex="activeTab" @tab-change="handleTabChange">
      <TabPanel header="Pending Actions">
        <TransferTable
          :loading="loading"
          :status-filter="pendingStatuses"
          @view="viewTransfer"
          @approve="approveTransfer"
          @ship="shipTransfer"
          @receive="receiveTransfer"
          @cancel="cancelTransfer"
        />
      </TabPanel>

      <TabPanel header="All Transfers">
        <TransferTable
          :loading="loading"
          @view="viewTransfer"
          @approve="approveTransfer"
          @ship="shipTransfer"
          @receive="receiveTransfer"
          @cancel="cancelTransfer"
        />
      </TabPanel>
    </TabView>

    <!-- Transfer Approval Modal -->
    <TransferApprovalModal
      :visible="showApprovalModal"
      :transfer="selectedTransfer"
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

import TransferTable from '@/components/Inventory/Tables/TransferTable.vue';
import TransferApprovalModal from '@/components/Inventory/Modals/TransferApprovalModal.vue';
import { useInventory } from '@/composables/useInventory';
import { useStockTransfer } from '@/composables/useStockTransfer';
import { useInventoryPermissions } from '@/composables/useInventoryPermissions';
import type { StockTransfer } from '@/types/inventory';

const router = useRouter();
const toast = useToast();
const { branches } = useInventory();
const { approveTransfer: approve, rejectTransfer: reject } = useStockTransfer();
const { canTransfer, canApprove } = useInventoryPermissions();

// Refs
const loading = ref(false);
const activeTab = ref(0);
const showApprovalModal = ref(false);
const selectedTransfer = ref<StockTransfer | null>(null);
const approvalMode = ref<'approve' | 'reject'>('approve');

const filters = ref({
  fromBranchId: null as number | null,
  toBranchId: null as number | null,
  status: null as string | null,
  dateFrom: null as Date | null,
});

const stats = ref({
  pending: 0,
  inTransit: 0,
  completed: 0,
  cancelled: 0,
  thisMonth: 0,
});

// Breadcrumb
const breadcrumbItems = [
  { label: 'Stock Transfers', to: '/inventory/transfers' },
];

// Status options
const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Pending Approval', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'In Preparation', value: 'in_preparation' },
  { label: 'Ready to Ship', value: 'ready_to_ship' },
  { label: 'In Transit', value: 'in_transit' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Partially Received', value: 'partially_received' },
  { label: 'Received', value: 'received' },
  { label: 'Completed', value: 'completed' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
];

const pendingStatuses = ['pending_approval', 'approved', 'in_transit', 'delivered'];

/**
 * Load data
 */
const loadData = async (): Promise<void> => {
  loading.value = true;
  try {
    await loadStats();
  } catch (error) {
    console.error('Failed to load transfers:', error);
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
    pending: 5,
    inTransit: 12,
    completed: 89,
    cancelled: 3,
    thisMonth: 109,
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
 * Create transfer
 */
const createTransfer = (): void => {
  router.push({ name: 'inventory.transfers.create' });
};

/**
 * View transfer
 */
const viewTransfer = (id: number): void => {
  router.push({ name: 'inventory.transfers.view', params: { id } });
};

/**
 * Approve transfer
 */
const approveTransfer = (transfer: StockTransfer): void => {
  selectedTransfer.value = transfer;
  approvalMode.value = 'approve';
  showApprovalModal.value = true;
};

/**
 * Ship transfer
 */
const shipTransfer = (id: number): void => {
  router.push({ name: 'inventory.transfers.ship', params: { id } });
};

/**
 * Receive transfer
 */
const receiveTransfer = (id: number): void => {
  router.push({ name: 'inventory.transfers.receive', params: { id } });
};

/**
 * Cancel transfer
 */
const cancelTransfer = async (id: number): Promise<void> => {
  // TODO: Implement cancel with ConfirmDialog
  toast.add({
    severity: 'warn',
    summary: 'Not Implemented',
    detail: 'Cancel functionality will be implemented with confirmation dialog',
    life: 3000,
  });
};

/**
 * Handle approve
 */
const handleApprove = async (): Promise<void> => {
  try {
    if (!selectedTransfer.value) return;
    
    await approve(selectedTransfer.value.id);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Transfer approved successfully',
      life: 3000,
    });

    closeApprovalModal();
    loadData();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to approve transfer',
      life: 5000,
    });
  }
};

/**
 * Handle reject
 */
const handleReject = async (reason: string): Promise<void> => {
  try {
    if (!selectedTransfer.value) return;
    
    await reject(selectedTransfer.value.id, reason);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Transfer rejected successfully',
      life: 3000,
    });

    closeApprovalModal();
    loadData();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to reject transfer',
      life: 5000,
    });
  }
};

/**
 * Close approval modal
 */
const closeApprovalModal = (): void => {
  showApprovalModal.value = false;
  selectedTransfer.value = null;
};

// Lifecycle
onMounted(() => {
  loadData();
});
</script>
