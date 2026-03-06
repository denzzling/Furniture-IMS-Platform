<template>
  <div class="alert-table-container">
    <!-- Toolbar -->
    <Toolbar class="mb-4">
      <template #start>
        <h2 class="text-xl font-semibold">Stock Alerts</h2>
        <Chip v-if="selectedAlerts.length > 0" :label="`${selectedAlerts.length} selected`" class="ml-3" />
      </template>
      <template #end>
        <div class="flex gap-2">
          <div class="flex items-center gap-2 mr-4">
            <ToggleButton
              v-model="autoRefresh"
              on-label="Auto-refresh ON"
              off-label="Auto-refresh OFF"
              on-icon="pi pi-replay"
              off-icon="pi pi-pause"
              class="text-sm"
            />
          </div>
          <Button 
            icon="pi pi-refresh" 
            outlined 
            @click="refreshData"
            aria-label="Refresh alerts"
          />
          <Button 
            label="Export" 
            icon="pi pi-download" 
            outlined 
            @click="exportCSV"
            aria-label="Export alerts to CSV"
          />
        </div>
      </template>
    </Toolbar>

    <!-- Bulk Actions Bar -->
    <Card v-if="selectedAlerts.length > 0" class="mb-4 bg-blue-50 border-blue-200">
      <template #content>
        <div class="flex items-center justify-between">
          <span class="font-semibold text-blue-900">
            {{ selectedAlerts.length }} alert(s) selected
          </span>
          <div class="flex gap-2">
            <Button
              v-if="canAcknowledgeAlerts"
              label="Acknowledge Selected"
              icon="pi pi-check"
              severity="info"
              @click="bulkAcknowledge"
            />
            <Button
              v-if="canResolveAlerts"
              label="Resolve Selected"
              icon="pi pi-check-circle"
              severity="success"
              @click="bulkResolve"
            />
            <Button
              label="Clear Selection"
              icon="pi pi-times"
              text
              @click="selectedAlerts = []"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Filters -->
    <Card class="mb-4">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="type-filter" class="block text-sm font-medium mb-2">Alert Type</label>
            <Select
              id="type-filter"
              v-model="filters.alertType"
              :options="typeOptions"
              option-label="label"
              option-value="value"
              placeholder="All Types"
              class="w-full"
              show-clear
            />
          </div>
          <div>
            <label for="status-filter" class="block text-sm font-medium mb-2">Status</label>
            <Select
              id="status-filter"
              v-model="filters.status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              placeholder="All Statuses"
              class="w-full"
              show-clear
            />
          </div>
          <div class="flex items-end">
            <Button
              label="Reset Filters"
              icon="pi pi-filter-slash"
              text
              @click="resetFilters"
              class="w-full"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- DataTable -->
    <DataTable
      ref="dt"
      v-model:selection="selectedAlerts"
      :value="alerts"
      :loading="loading"
      :paginator="true"
      :rows="15"
      :rows-per-page-options="[10, 15, 25, 50]"
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageSelect"
      current-page-report-template="Showing {first} to {last} of {totalRecords} alerts"
      responsive-layout="stack"
      breakpoint="960px"
      striped-rows
      hover-rows
      data-key="id"
      class="shadow-sm"
    >
      <!-- Selection Column -->
      <Column selection-mode="multiple" header-style="width: 3rem" :exportable="false" />

      <!-- Alert Type -->
      <Column field="alert_type" header="Alert Type" sortable style="min-width: 180px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <div v-else class="flex items-center gap-2">
            <AlertPriorityBadge :type="data.alert_type" :priority="data.priority" />
          </div>
        </template>
      </Column>

      <!-- Product -->
      <Column field="product.product_name" header="Product" sortable style="min-width: 250px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="3rem" />
          </div>
          <div v-else class="flex items-center gap-3">
            <Avatar
              v-if="data.inventory?.product?.image_url"
              :image="data.inventory.product.image_url"
              size="large"
              shape="square"
              class="border"
            />
            <Avatar
              v-else
              icon="pi pi-box"
              size="large"
              shape="square"
              class="bg-gray-200 text-gray-600"
            />
            <div class="flex flex-col">
              <span class="font-semibold text-gray-900">
                {{ data.inventory?.product?.product_name || 'N/A' }}
              </span>
              <span class="text-sm text-gray-500">
                SKU: {{ data.inventory?.product?.sku || 'N/A' }}
              </span>
            </div>
          </div>
        </template>
      </Column>

      <!-- Branch -->
      <Column field="branch.name" header="Branch" sortable style="min-width: 150px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <div v-else class="flex items-center gap-2">
            <i class="pi pi-building text-gray-500"></i>
            <span>{{ data.inventory?.branch?.name || 'N/A' }}</span>
          </div>
        </template>
      </Column>

      <!-- Current Quantity -->
      <Column field="current_quantity" header="Current Qty" sortable style="min-width: 130px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else class="font-semibold" :class="getQuantityClass(data)">
            {{ data.current_quantity }}
          </span>
        </template>
      </Column>

      <!-- Reorder Point -->
      <Column field="reorder_point" header="Reorder Point" sortable style="min-width: 140px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else class="text-gray-700">
            {{ data.reorder_point || data.inventory?.reorder_point || 'N/A' }}
          </span>
        </template>
      </Column>

      <!-- Recommended Order -->
      <Column field="recommended_order_quantity" header="Recommended Order" sortable style="min-width: 170px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <Chip
            v-else-if="data.recommended_order_quantity"
            :label="`Order ${data.recommended_order_quantity}`"
            icon="pi pi-shopping-cart"
            class="bg-blue-100 text-blue-800"
          />
          <span v-else class="text-gray-400">—</span>
        </template>
      </Column>

      <!-- Status -->
      <Column field="status" header="Status" sortable style="min-width: 140px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <Tag
            v-else
            :value="getStatusLabel(data.status)"
            :severity="getStatusSeverity(data.status)"
          />
        </template>
      </Column>

      <!-- Created -->
      <Column field="created_at" header="Created" sortable style="min-width: 150px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else class="text-sm text-gray-600">
            {{ formatDate(data.created_at) }}
          </span>
        </template>
      </Column>

      <!-- Actions -->
      <Column :exportable="false" header="Actions" style="min-width: 120px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <div v-else class="flex gap-2">
            <Button
              v-if="canAcknowledgeAlerts && data.status === 'active'"
              icon="pi pi-check"
              text
              rounded
              severity="info"
              @click="handleAcknowledge(data)"
              aria-label="Acknowledge alert"
            />
            <Button
              v-if="canResolveAlerts && data.status === 'acknowledged'"
              icon="pi pi-check-circle"
              text
              rounded
              severity="success"
              @click="handleResolve(data)"
              aria-label="Resolve alert"
            />
            <Button
              icon="pi pi-eye"
              text
              rounded
              severity="info"
              @click="handleView(data)"
              aria-label="View alert details"
            />
          </div>
        </template>
      </Column>

      <!-- Empty State -->
      <template #empty>
        <div class="text-center py-12">
          <i class="pi pi-bell text-6xl text-gray-300 mb-4"></i>
          <p class="text-xl text-gray-500">No alerts found</p>
          <p class="text-sm text-gray-400">Your inventory levels are looking good!</p>
        </div>
      </template>

      <!-- Loading State -->
      <template #loading>
        <div class="flex items-center justify-center py-8">
          <ProgressSpinner style="width: 50px; height: 50px" />
          <span class="ml-3 text-lg">Loading alerts...</span>
        </div>
      </template>
    </DataTable>

    <!-- Confirmation Dialogs -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Toolbar from 'primevue/toolbar';
import Card from 'primevue/card';
import Select from 'primevue/dropdown';
import Tag from 'primevue/tag';
import Chip from 'primevue/chip';
import Avatar from 'primevue/avatar';
import ToggleButton from 'primevue/togglebutton';
import ConfirmDialog from 'primevue/confirmdialog';
import Skeleton from 'primevue/skeleton';
import ProgressSpinner from 'primevue/progressspinner';

import { useStockAlert } from '@/composables/inventory/useStockAlert';
import { useInventoryPermissions } from '@/composables/inventory/useInventoryPermissions';
import AlertPriorityBadge from '@/components/Inventory/Widgets/AlertPriorityBadge.vue';
import type { StockAlert } from '@/types/inventory';

/**
 * Props interface for AlertTable component
 */
interface Props {
  branchId?: number;
  initialFilters?: {
    alertType?: string;
    status?: string;
  };
}

const props = withDefaults(defineProps<Props>(), {
  initialFilters: () => ({}),
});

// Composables
const { alerts, loading, fetchAlerts, acknowledgeAlert, resolveAlert, bulkAcknowledge: bulkAcknowledgeAlerts } = useStockAlert();
const { canAcknowledgeAlerts, canResolveAlerts } = useInventoryPermissions();
const confirm = useConfirm();
const toast = useToast();

// Refs
const dt = ref();
const selectedAlerts = ref<StockAlert[]>([]);
const autoRefresh = ref(true);
const refreshInterval = ref<number | null>(null);

const filters = ref({
  alertType: props.initialFilters.alertType || null,
  status: props.initialFilters.status || null,
});

// Filter options
const typeOptions = [
  { label: 'Low Stock', value: 'low_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' },
  { label: 'Overstock', value: 'overstock' },
  { label: 'Reorder Point', value: 'reorder_point' },
  { label: 'Expiring Soon', value: 'expiring_soon' },
];

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Acknowledged', value: 'acknowledged' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Auto-Resolved', value: 'auto_resolved' },
];

/**
 * Get status label
 */
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: 'Active',
    acknowledged: 'Acknowledged',
    resolved: 'Resolved',
    auto_resolved: 'Auto-Resolved',
  };
  return labels[status] || status;
};

/**
 * Get status severity for Tag component
 */
const getStatusSeverity = (status: string): 'danger' | 'warning' | 'success' | 'info' => {
  const severities: Record<string, 'danger' | 'warning' | 'success' | 'info'> = {
    active: 'danger',
    acknowledged: 'warning',
    resolved: 'success',
    auto_resolved: 'info',
  };
  return severities[status] || 'info';
};

/**
 * Get quantity class based on alert type
 */
const getQuantityClass = (alert: StockAlert): string => {
  if (alert.alert_type === 'out_of_stock') return 'text-red-600';
  if (alert.alert_type === 'low_stock') return 'text-orange-500';
  if (alert.alert_type === 'overstock') return 'text-blue-600';
  return 'text-gray-900';
};

/**
 * Format date
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Handle acknowledge single alert
 */
const handleAcknowledge = (alert: StockAlert): void => {
  confirm.require({
    message: `Acknowledge this ${alert.alert_type.replace('_', ' ')} alert?`,
    header: 'Acknowledge Alert',
    icon: 'pi pi-info-circle',
    acceptClass: 'p-button-info',
    acceptLabel: 'Acknowledge',
    rejectLabel: 'Cancel',
    accept: async () => {
      try {
        await acknowledgeAlert(alert.id, '');
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Alert acknowledged',
          life: 3000,
        });
        await refreshData();
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.response?.data?.message || 'Failed to acknowledge alert',
          life: 3000,
        });
      }
    },
  });
};

/**
 * Handle resolve single alert
 */
const handleResolve = (alert: StockAlert): void => {
  confirm.require({
    message: `Mark this alert as resolved?`,
    header: 'Resolve Alert',
    icon: 'pi pi-check-circle',
    acceptClass: 'p-button-success',
    acceptLabel: 'Resolve',
    rejectLabel: 'Cancel',
    accept: async () => {
      try {
        await resolveAlert(alert.id, '');
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Alert resolved',
          life: 3000,
        });
        await refreshData();
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.response?.data?.message || 'Failed to resolve alert',
          life: 3000,
        });
      }
    },
  });
};

/**
 * Handle bulk acknowledge
 */
const bulkAcknowledge = (): void => {
  const activeAlerts = selectedAlerts.value.filter((a) => a.status === 'active');
  
  if (activeAlerts.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'No active alerts selected',
      life: 3000,
    });
    return;
  }

  confirm.require({
    message: `Acknowledge ${activeAlerts.length} alert(s)?`,
    header: 'Bulk Acknowledge',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-info',
    acceptLabel: 'Acknowledge All',
    rejectLabel: 'Cancel',
    accept: async () => {
      try {
        const alertIds = activeAlerts.map((a) => a.id);
        await bulkAcknowledgeAlerts(alertIds);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: `${activeAlerts.length} alert(s) acknowledged`,
          life: 3000,
        });
        selectedAlerts.value = [];
        await refreshData();
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.response?.data?.message || 'Failed to acknowledge alerts',
          life: 3000,
        });
      }
    },
  });
};

/**
 * Handle bulk resolve
 */
const bulkResolve = (): void => {
  const acknowledgedAlerts = selectedAlerts.value.filter((a) => a.status === 'acknowledged');
  
  if (acknowledgedAlerts.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'No acknowledged alerts selected',
      life: 3000,
    });
    return;
  }

  confirm.require({
    message: `Resolve ${acknowledgedAlerts.length} alert(s)?`,
    header: 'Bulk Resolve',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-success',
    acceptLabel: 'Resolve All',
    rejectLabel: 'Cancel',
    accept: async () => {
      try {
        for (const alert of acknowledgedAlerts) {
          await resolveAlert(alert.id, 'Bulk resolved');
        }
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: `${acknowledgedAlerts.length} alert(s) resolved`,
          life: 3000,
        });
        selectedAlerts.value = [];
        await refreshData();
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.response?.data?.message || 'Failed to resolve alerts',
          life: 3000,
        });
      }
    },
  });
};

/**
 * Handle view alert
 */
const handleView = (alert: StockAlert): void => {
  // Could open a modal or navigate to detail page
  toast.add({
    severity: 'info',
    summary: 'Alert Details',
    detail: `View details for alert #${alert.id}`,
    life: 3000,
  });
};

/**
 * Refresh data
 */
const refreshData = async (): Promise<void> => {
  await fetchAlerts(buildFilters());
};

/**
 * Reset all filters
 */
const resetFilters = (): void => {
  filters.value = {
    alertType: null,
    status: null,
  };
};

/**
 * Build filters object for API
 */
const buildFilters = () => {
  const apiFilters: any = {};
  if (props.branchId) apiFilters.branch_id = props.branchId;
  if (filters.value.alertType) apiFilters.alert_type = filters.value.alertType;
  if (filters.value.status) apiFilters.status = filters.value.status;
  return apiFilters;
};

/**
 * Export table to CSV
 */
const exportCSV = (): void => {
  dt.value.exportCSV();
  toast.add({
    severity: 'info',
    summary: 'Export Started',
    detail: 'Downloading CSV file...',
    life: 3000,
  });
};

/**
 * Start auto-refresh interval
 */
const startAutoRefresh = (): void => {
  if (refreshInterval.value) return;
  
  refreshInterval.value = window.setInterval(() => {
    refreshData();
  }, 30000); // 30 seconds
};

/**
 * Stop auto-refresh interval
 */
const stopAutoRefresh = (): void => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
};

// Lifecycle hooks
onMounted(async () => {
  await fetchAlerts(buildFilters());
  if (autoRefresh.value) {
    startAutoRefresh();
  }
});

onUnmounted(() => {
  stopAutoRefresh();
});

// Watch filters
watch(
  filters,
  async () => {
    await fetchAlerts(buildFilters());
  },
  { deep: true }
);

// Watch auto-refresh toggle
watch(autoRefresh, (newValue) => {
  if (newValue) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
});
</script>
