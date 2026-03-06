<template>
  <div class="stock-alert-index p-4">
    <!-- Breadcrumb -->
    <Breadcrumb :home="{ label: 'Dashboard', to: '/inventory' }" :model="breadcrumbItems" class="mb-4" />

    <!-- Page Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">Stock Alerts</h1>
        <p class="text-gray-600 mt-1">Monitor and manage inventory alerts</p>
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
          icon="pi pi-bolt"
          label="Generate Alerts"
          severity="warning"
          @click="generateAlerts"
          :loading="generatingAlerts"
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

          <!-- Alert Type Filter -->
          <div>
            <label for="alertType" class="block text-sm font-medium mb-2">Alert Type</label>
            <Dropdown
              id="alertType"
              v-model="filters.alertType"
              :options="alertTypes"
              option-label="label"
              option-value="value"
              placeholder="All Types"
              show-clear
              class="w-full"
              @change="applyFilters"
            />
          </div>

          <!-- Priority Filter -->
          <div>
            <label for="priority" class="block text-sm font-medium mb-2">Priority</label>
            <Dropdown
              id="priority"
              v-model="filters.priority"
              :options="priorityOptions"
              option-label="label"
              option-value="value"
              placeholder="All Priorities"
              show-clear
              class="w-full"
              @change="applyFilters"
            />
          </div>

          <!-- Status Filter -->
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
        </div>
      </template>
    </Card>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <Card class="bg-red-50 border border-red-200">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-red-700 mb-1">High Priority</p>
            <p class="text-2xl font-bold text-red-900">{{ stats.highPriority }}</p>
          </div>
        </template>
      </Card>
      <Card class="bg-orange-50 border border-orange-200">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-orange-700 mb-1">Medium Priority</p>
            <p class="text-2xl font-bold text-orange-900">{{ stats.mediumPriority }}</p>
          </div>
        </template>
      </Card>
      <Card class="bg-blue-50 border border-blue-200">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-blue-700 mb-1">Low Priority</p>
            <p class="text-2xl font-bold text-blue-900">{{ stats.lowPriority }}</p>
          </div>
        </template>
      </Card>
      <Card class="bg-green-50 border border-green-200">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-green-700 mb-1">Resolved</p>
            <p class="text-2xl font-bold text-green-900">{{ stats.resolved }}</p>
          </div>
        </template>
      </Card>
      <Card class="bg-gray-50 border border-gray-200">
        <template #content>
          <div class="text-center">
            <p class="text-sm text-gray-700 mb-1">Total Active</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.totalActive }}</p>
          </div>
        </template>
      </Card>
    </div>

    <!-- Bulk Actions Toolbar -->
    <div v-if="selectedAlerts.length > 0" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
      <span class="text-sm font-medium text-blue-900">
        {{ selectedAlerts.length }} alert(s) selected
      </span>
      <div class="flex gap-2">
        <Button
          label="Acknowledge Selected"
          icon="pi pi-check"
          severity="info"
          size="small"
          @click="bulkAcknowledge"
        />
        <Button
          label="Resolve Selected"
          icon="pi pi-check-circle"
          severity="success"
          size="small"
          @click="bulkResolve"
        />
      </div>
    </div>

    <!-- Auto-Refresh Toggle -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <i class="pi pi-sync text-gray-600"></i>
        <span class="text-sm text-gray-600">Auto-refresh every 30 seconds</span>
        <InputSwitch v-model="autoRefresh" @change="toggleAutoRefresh" />
      </div>
      <div v-if="lastRefresh" class="text-sm text-gray-500">
        Last updated: {{ formatRelativeTime(lastRefresh) }}
      </div>
    </div>

    <!-- Alerts Table -->
    <AlertTable
      :loading="loading"
      @selection-change="handleSelectionChange"
      @acknowledge="acknowledgeAlert"
      @resolve="resolveAlert"
      @view="viewAlert"
    />

    <!-- Alert Acknowledge Modal -->
    <AlertAcknowledgeModal
      :visible="showAcknowledgeModal"
      :alert="selectedAlert"
      @acknowledge="handleAcknowledge"
      @close="closeAcknowledgeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Breadcrumb from 'primevue/breadcrumb';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputSwitch from 'primevue/inputswitch';

import AlertTable from '@/components/Inventory/Tables/AlertTable.vue';
import AlertAcknowledgeModal from '@/components/Inventory/Modals/AlertAcknowledgeModal.vue';
import { useInventory } from '@/composables/useInventory';
import { useStockAlert } from '@/composables/useStockAlert';
import type { StockAlert } from '@/types/inventory';

const router = useRouter();
const toast = useToast();
const { branches } = useInventory();
const { acknowledgeAlert: acknowledge, resolveAlert: resolve, generateAlerts: generate } = useStockAlert();

// Refs
const loading = ref(false);
const generatingAlerts = ref(false);
const autoRefresh = ref(false);
const lastRefresh = ref<Date | null>(null);
const showAcknowledgeModal = ref(false);
const selectedAlert = ref<StockAlert | null>(null);
const selectedAlerts = ref<StockAlert[]>([]);

const filters = ref({
  branchId: null as number | null,
  alertType: null as string | null,
  priority: null as string | null,
  status: null as string | null,
});

const stats = ref({
  highPriority: 0,
  mediumPriority: 0,
  lowPriority: 0,
  resolved: 0,
  totalActive: 0,
});

// Auto-refresh interval
let refreshInterval: NodeJS.Timeout | null = null;

// Breadcrumb
const breadcrumbItems = [
  { label: 'Stock Alerts', to: '/inventory/alerts' },
];

// Alert types
const alertTypes = [
  { label: 'Low Stock', value: 'low_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' },
  { label: 'Overstock', value: 'overstock' },
  { label: 'Reorder Point', value: 'reorder_point' },
  { label: 'Expiring Soon', value: 'expiring_soon' },
];

// Priority options
const priorityOptions = [
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

// Status options
const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Acknowledged', value: 'acknowledged' },
  { label: 'Resolved', value: 'resolved' },
];

/**
 * Load data
 */
const loadData = async (): Promise<void> => {
  loading.value = true;
  try {
    await loadStats();
    lastRefresh.value = new Date();
  } catch (error) {
    console.error('Failed to load alerts:', error);
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
    highPriority: 15,
    mediumPriority: 28,
    lowPriority: 42,
    resolved: 156,
    totalActive: 85,
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
 * Toggle auto-refresh
 */
const toggleAutoRefresh = (): void => {
  if (autoRefresh.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
};

/**
 * Start auto-refresh
 */
const startAutoRefresh = (): void => {
  if (refreshInterval) return;
  
  refreshInterval = setInterval(() => {
    loadData();
  }, 30000); // 30 seconds
};

/**
 * Stop auto-refresh
 */
const stopAutoRefresh = (): void => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

/**
 * Generate alerts
 */
const generateAlerts = async (): Promise<void> => {
  generatingAlerts.value = true;
  try {
    await generate();
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Alerts generated successfully',
      life: 3000,
    });

    loadData();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to generate alerts',
      life: 5000,
    });
  } finally {
    generatingAlerts.value = false;
  }
};

/**
 * Handle selection change
 */
const handleSelectionChange = (alerts: StockAlert[]): void => {
  selectedAlerts.value = alerts;
};

/**
 * Acknowledge alert
 */
const acknowledgeAlert = (alert: StockAlert): void => {
  selectedAlert.value = alert;
  showAcknowledgeModal.value = true;
};

/**
 * Resolve alert
 */
const resolveAlert = async (id: number): Promise<void> => {
  try {
    await resolve(id);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Alert resolved successfully',
      life: 3000,
    });

    loadData();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to resolve alert',
      life: 5000,
    });
  }
};

/**
 * View alert details
 */
const viewAlert = (id: number): void => {
  router.push({ name: 'inventory.alerts.view', params: { id } });
};

/**
 * Bulk acknowledge
 */
const bulkAcknowledge = async (): Promise<void> => {
  try {
    const ids = selectedAlerts.value.map(a => a.id);
    // Call bulk acknowledge API
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `${ids.length} alert(s) acknowledged successfully`,
      life: 3000,
    });

    selectedAlerts.value = [];
    loadData();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to acknowledge alerts',
      life: 5000,
    });
  }
};

/**
 * Bulk resolve
 */
const bulkResolve = async (): Promise<void> => {
  try {
    const ids = selectedAlerts.value.map(a => a.id);
    // Call bulk resolve API
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `${ids.length} alert(s) resolved successfully`,
      life: 3000,
    });

    selectedAlerts.value = [];
    loadData();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to resolve alerts',
      life: 5000,
    });
  }
};

/**
 * Handle acknowledge
 */
const handleAcknowledge = async (note: string): Promise<void> => {
  try {
    if (!selectedAlert.value) return;
    
    await acknowledge(selectedAlert.value.id, note);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Alert acknowledged successfully',
      life: 3000,
    });

    closeAcknowledgeModal();
    loadData();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to acknowledge alert',
      life: 5000,
    });
  }
};

/**
 * Close acknowledge modal
 */
const closeAcknowledgeModal = (): void => {
  showAcknowledgeModal.value = false;
  selectedAlert.value = null;
};

/**
 * Format relative time
 */
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  return date.toLocaleTimeString();
};

// Lifecycle
onMounted(() => {
  loadData();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>
