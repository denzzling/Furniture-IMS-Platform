<template>
  <div class="transfer-table-container">
    <!-- Toolbar -->
    <Toolbar class="mb-4">
      <template #start>
        <h2 class="text-xl font-semibold">Stock Transfers</h2>
      </template>
      <template #end>
        <div class="flex gap-2">
          <Button 
            icon="pi pi-refresh" 
            outlined 
            @click="refreshData"
            aria-label="Refresh transfers"
          />
          <Button 
            label="Export" 
            icon="pi pi-download" 
            outlined 
            @click="exportCSV"
            aria-label="Export transfers to CSV"
          />
        </div>
      </template>
    </Toolbar>

    <!-- Filters -->
    <Card class="mb-4">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div>
            <label for="from-branch-filter" class="block text-sm font-medium mb-2">From Branch</label>
            <Select
              id="from-branch-filter"
              v-model="filters.fromBranch"
              :options="branchOptions"
              option-label="label"
              option-value="value"
              placeholder="All Branches"
              class="w-full"
              show-clear
            />
          </div>
          <div>
            <label for="to-branch-filter" class="block text-sm font-medium mb-2">To Branch</label>
            <Select
              id="to-branch-filter"
              v-model="filters.toBranch"
              :options="branchOptions"
              option-label="label"
              option-value="value"
              placeholder="All Branches"
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
      :value="transfers"
      :loading="loading"
      :paginator="true"
      :rows="15"
      :rows-per-page-options="[10, 15, 25, 50]"
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageSelect"
      current-page-report-template="Showing {first} to {last} of {totalRecords} transfers"
      responsive-layout="stack"
      breakpoint="960px"
      striped-rows
      :row-hover="true"
      @row-click="handleRowClick"
      class="shadow-sm cursor-pointer"
    >
      <!-- Transfer Number -->
      <Column field="transfer_number" header="Transfer #" sortable style="min-width: 150px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else class="font-semibold text-primary">
            {{ data.transfer_number }}
          </span>
        </template>
      </Column>

      <!-- From Branch -->
      <Column field="from_branch.name" header="From Branch" sortable style="min-width: 180px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <div v-else class="flex items-center gap-2">
            <i class="pi pi-building text-gray-500"></i>
            <span>{{ data.from_branch?.name || 'N/A' }}</span>
          </div>
        </template>
      </Column>

      <!-- To Branch -->
      <Column field="to_branch.name" header="To Branch" sortable style="min-width: 180px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <div v-else class="flex items-center gap-2">
            <i class="pi pi-building text-blue-500"></i>
            <span>{{ data.to_branch?.name || 'N/A' }}</span>
          </div>
        </template>
      </Column>

      <!-- Status -->
      <Column field="status" header="Status" sortable style="min-width: 180px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <div v-else class="flex flex-col gap-1">
            <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
            <ProgressBar
              v-if="data.status === 'in_transit' || data.status === 'partially_received'"
              :value="getProgressValue(data.status)"
              :show-value="false"
              style="height: 4px"
            />
          </div>
        </template>
      </Column>

      <!-- Requested Date -->
      <Column field="requested_date" header="Requested Date" sortable style="min-width: 150px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else>{{ formatDate(data.requested_date) }}</span>
        </template>
      </Column>

      <!-- Expected Delivery -->
      <Column field="expected_delivery_date" header="Expected Delivery" sortable style="min-width: 150px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else :class="getDeliveryDateClass(data)">
            {{ formatDate(data.expected_delivery_date) }}
          </span>
        </template>
      </Column>

      <!-- Total Items -->
      <Column field="total_items" header="Total Items" sortable style="min-width: 120px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else class="font-semibold">{{ data.total_items || 0 }}</span>
        </template>
      </Column>

      <!-- Goods Value -->
      <Column field="total_goods_value" header="Goods Value" sortable style="min-width: 150px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else class="font-medium">
            {{ data.total_goods_value ? formatCurrency(data.total_goods_value) : '—' }}
          </span>
        </template>
      </Column>

      <!-- Transfer Cost -->
      <Column field="transfer_cost" header="Transfer Cost" sortable style="min-width: 130px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else class="text-gray-600">
            {{ data.transfer_cost ? formatCurrency(data.transfer_cost) : '—' }}
          </span>
        </template>
      </Column>

      <!-- Actions -->
      <Column :exportable="false" header="Actions" style="min-width: 150px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <div v-else class="flex gap-2">
            <Button
              icon="pi pi-eye"
              text
              rounded
              severity="info"
              @click.stop="handleView(data.id)"
              aria-label="View transfer details"
            />
            <Button
              v-if="canApproveTransfers && data.status === 'requested'"
              icon="pi pi-check"
              text
              rounded
              severity="success"
              @click.stop="handleApprove(data)"
              aria-label="Approve transfer"
            />
            <Button
              v-if="canShipTransfers && (data.status === 'sender_approved' || data.status === 'receiver_approved')"
              icon="pi pi-send"
              text
              rounded
              severity="info"
              @click.stop="handleShip(data)"
              aria-label="Ship transfer"
            />
            <Button
              v-if="canReceiveTransfers && data.status === 'in_transit'"
              icon="pi pi-inbox"
              text
              rounded
              severity="success"
              @click.stop="handleReceive(data)"
              aria-label="Receive transfer"
            />
            <Button
              v-if="data.status === 'requested' || data.status === 'sender_approved'"
              icon="pi pi-times"
              text
              rounded
              severity="danger"
              @click.stop="handleCancel(data)"
              aria-label="Cancel transfer"
            />
          </div>
        </template>
      </Column>

      <!-- Empty State -->
      <template #empty>
        <div class="text-center py-12">
          <i class="pi pi-inbox text-6xl text-gray-300 mb-4"></i>
          <p class="text-xl text-gray-500">No transfers found</p>
          <p class="text-sm text-gray-400">Try adjusting your filters or create a new transfer</p>
        </div>
      </template>

      <!-- Loading State -->
      <template #loading>
        <div class="flex items-center justify-center py-8">
          <ProgressSpinner style="width: 50px; height: 50px" />
          <span class="ml-3 text-lg">Loading transfers...</span>
        </div>
      </template>
    </DataTable>

    <!-- Confirmation Dialogs -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Toolbar from 'primevue/toolbar';
import Card from 'primevue/card';
import Select from 'primevue/dropdown';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';
import ConfirmDialog from 'primevue/confirmdialog';
import Skeleton from 'primevue/skeleton';
import ProgressSpinner from 'primevue/progressspinner';

import { useStockTransfer } from '@/composables/inventory/useStockTransfer';
import { useInventoryPermissions } from '@/composables/inventory/useInventoryPermissions';
import type { StockTransfer } from '@/types/inventory';

/**
 * Props interface for TransferTable component
 */
interface Props {
  initialFilters?: {
    status?: string;
    fromBranch?: number;
    toBranch?: number;
  };
}

const props = withDefaults(defineProps<Props>(), {
  initialFilters: () => ({}),
});

// Composables
const router = useRouter();
const { transfers, loading, fetchTransfers, approveTransfer, shipTransfer, receiveTransfer, cancelTransfer } = useStockTransfer();
const { canApproveTransfers, canShipTransfers, canReceiveTransfers } = useInventoryPermissions();
const confirm = useConfirm();
const toast = useToast();

// Refs
const dt = ref();
const filters = ref({
  status: props.initialFilters.status || null,
  fromBranch: props.initialFilters.fromBranch || null,
  toBranch: props.initialFilters.toBranch || null,
});

// Filter options
const statusOptions = [
  { label: 'Requested', value: 'requested' },
  { label: 'Sender Approved', value: 'sender_approved' },
  { label: 'Receiver Approved', value: 'receiver_approved' },
  { label: 'In Transit', value: 'in_transit' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Received', value: 'received' },
  { label: 'Partially Received', value: 'partially_received' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Rejected', value: 'rejected' },
];

const branchOptions = ref<Array<{ label: string; value: number }>>([]);

/**
 * Get status label
 */
const getStatusLabel = (status: string): string => {
  const option = statusOptions.find((opt) => opt.value === status);
  return option?.label || status;
};

/**
 * Get status severity for Tag component
 */
const getStatusSeverity = (status: string): 'secondary' | 'info' | 'success' | 'warning' | 'danger' => {
  const severities: Record<string, 'secondary' | 'info' | 'success' | 'warning' | 'danger'> = {
    requested: 'secondary',
    sender_approved: 'info',
    receiver_approved: 'info',
    in_transit: 'warning',
    delivered: 'info',
    received: 'info',
    partially_received: 'warning',
    completed: 'success',
    cancelled: 'danger',
    rejected: 'danger',
  };
  return severities[status] || 'secondary';
};

/**
 * Get progress value for in-transit transfers
 */
const getProgressValue = (status: string): number => {
  const progress: Record<string, number> = {
    in_transit: 75,
    partially_received: 90,
  };
  return progress[status] || 0;
};

/**
 * Get delivery date class based on status
 */
const getDeliveryDateClass = (transfer: StockTransfer): string => {
  if (transfer.status === 'completed' || transfer.status === 'cancelled') {
    return 'text-gray-500';
  }
  
  const today = new Date();
  const deliveryDate = new Date(transfer.expected_delivery_date);
  
  if (deliveryDate < today) {
    return 'text-red-600 font-semibold';
  } else if (deliveryDate.getTime() - today.getTime() < 2 * 24 * 60 * 60 * 1000) {
    return 'text-orange-500 font-semibold';
  }
  
  return 'text-gray-700';
};

/**
 * Format date
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format currency as Philippine Peso
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value);
};

/**
 * Handle row click - navigate to detail view
 */
const handleRowClick = (event: any): void => {
  router.push(`/inventory/transfers/${event.data.id}`);
};

/**
 * Handle view action
 */
const handleView = (id: number): void => {
  router.push(`/inventory/transfers/${id}`);
};

/**
 * Handle approve action
 */
const handleApprove = (transfer: StockTransfer): void => {
  confirm.require({
    message: `Are you sure you want to approve transfer ${transfer.transfer_number}?`,
    header: 'Approve Transfer',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-success',
    acceptLabel: 'Approve',
    rejectLabel: 'Cancel',
    accept: async () => {
      try {
        await approveTransfer(transfer.id);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Transfer approved successfully',
          life: 3000,
        });
        await refreshData();
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.response?.data?.message || 'Failed to approve transfer',
          life: 3000,
        });
      }
    },
  });
};

/**
 * Handle ship action
 */
const handleShip = (transfer: StockTransfer): void => {
  router.push(`/inventory/transfers/${transfer.id}/ship`);
};

/**
 * Handle receive action
 */
const handleReceive = (transfer: StockTransfer): void => {
  router.push(`/inventory/transfers/${transfer.id}/receive`);
};

/**
 * Handle cancel action
 */
const handleCancel = (transfer: StockTransfer): void => {
  confirm.require({
    message: `Are you sure you want to cancel transfer ${transfer.transfer_number}?`,
    header: 'Cancel Transfer',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Cancel Transfer',
    rejectLabel: 'Keep Transfer',
    accept: async () => {
      try {
        await cancelTransfer(transfer.id, 'Cancelled from table view');
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Transfer cancelled',
          life: 3000,
        });
        await refreshData();
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.response?.data?.message || 'Failed to cancel transfer',
          life: 3000,
        });
      }
    },
  });
};

/**
 * Refresh data
 */
const refreshData = async (): Promise<void> => {
  await fetchTransfers(buildFilters());
};

/**
 * Reset all filters
 */
const resetFilters = (): void => {
  filters.value = {
    status: null,
    fromBranch: null,
    toBranch: null,
  };
};

/**
 * Build filters object for API
 */
const buildFilters = () => {
  const apiFilters: any = {};
  if (filters.value.status) apiFilters.status = filters.value.status;
  if (filters.value.fromBranch) apiFilters.from_branch_id = filters.value.fromBranch;
  if (filters.value.toBranch) apiFilters.to_branch_id = filters.value.toBranch;
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

// Lifecycle hooks
onMounted(async () => {
  await fetchTransfers(buildFilters());
});

// Watch filters
watch(
  filters,
  async () => {
    await fetchTransfers(buildFilters());
  },
  { deep: true }
);
</script>

<style scoped>
/* Make rows clickable */
:deep(.p-datatable-tbody > tr) {
  cursor: pointer;
  transition: background-color 0.2s;
}

:deep(.p-datatable-tbody > tr:hover) {
  background-color: #f3f4f6;
}
</style>
