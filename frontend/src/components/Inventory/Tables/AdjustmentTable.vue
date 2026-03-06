<template>
  <div class="adjustment-table-container">
    <!-- Toolbar -->
    <Toolbar class="mb-4">
      <template #start>
        <h2 class="text-xl font-semibold">Stock Adjustments</h2>
      </template>
      <template #end>
        <div class="flex gap-2">
          <Button 
            icon="pi pi-refresh" 
            outlined 
            @click="refreshData"
            aria-label="Refresh adjustments"
          />
          <Button 
            label="Export" 
            icon="pi pi-download" 
            outlined 
            @click="exportCSV"
            aria-label="Export adjustments to CSV"
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
            <label for="type-filter" class="block text-sm font-medium mb-2">Type</label>
            <Select
              id="type-filter"
              v-model="filters.type"
              :options="typeOptions"
              option-label="label"
              option-value="value"
              placeholder="All Types"
              class="w-full"
              show-clear
            />
          </div>
          <div>
            <label for="date-from" class="block text-sm font-medium mb-2">From Date</label>
            <Calendar
              id="date-from"
              v-model="filters.dateFrom"
              date-format="yy-mm-dd"
              placeholder="Start date"
              class="w-full"
              show-button-bar
            />
          </div>
          <div>
            <label for="date-to" class="block text-sm font-medium mb-2">To Date</label>
            <Calendar
              id="date-to"
              v-model="filters.dateTo"
              date-format="yy-mm-dd"
              placeholder="End date"
              class="w-full"
              show-button-bar
            />
          </div>
        </div>
        <div class="flex justify-end mt-4">
          <Button
            label="Reset Filters"
            icon="pi pi-filter-slash"
            text
            @click="resetFilters"
          />
        </div>
      </template>
    </Card>

    <!-- DataTable -->
    <DataTable
      ref="dt"
      :value="adjustments"
      :loading="loading"
      :paginator="true"
      :rows="15"
      :rows-per-page-options="[10, 15, 25, 50]"
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageSelect"
      current-page-report-template="Showing {first} to {last} of {totalRecords} adjustments"
      responsive-layout="stack"
      breakpoint="960px"
      striped-rows
      :row-hover="true"
      @row-click="handleRowClick"
      class="shadow-sm cursor-pointer"
    >
      <!-- Adjustment Number -->
      <Column field="adjustment_number" header="Adjustment #" sortable style="min-width: 150px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else class="font-semibold text-primary">
            {{ data.adjustment_number }}
          </span>
        </template>
      </Column>

      <!-- Branch -->
      <Column field="branch.name" header="Branch" sortable style="min-width: 180px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <div v-else class="flex items-center gap-2">
            <i class="pi pi-building text-gray-500"></i>
            <span>{{ data.branch?.name || 'N/A' }}</span>
          </div>
        </template>
      </Column>

      <!-- Type -->
      <Column field="adjustment_type" header="Type" sortable style="min-width: 150px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <Chip v-else :label="getTypeLabel(data.adjustment_type)" class="text-sm" />
        </template>
      </Column>

      <!-- Status -->
      <Column field="status" header="Status" sortable style="min-width: 130px">
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

      <!-- Adjustment Date -->
      <Column field="adjustment_date" header="Adjustment Date" sortable style="min-width: 150px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else>{{ formatDate(data.adjustment_date) }}</span>
        </template>
      </Column>

      <!-- Created By -->
      <Column field="created_by" header="Created By" style="min-width: 150px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <div v-else class="flex items-center gap-2">
            <i class="pi pi-user text-gray-500"></i>
            <span>{{ data.created_by?.name || 'N/A' }}</span>
          </div>
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

      <!-- Value Difference -->
      <Column field="total_value_difference" header="Value Difference" sortable style="min-width: 150px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span
            v-else
            class="font-semibold"
            :class="{
              'text-green-600': data.total_value_difference > 0,
              'text-red-600': data.total_value_difference < 0,
              'text-gray-600': data.total_value_difference === 0
            }"
          >
            {{ data.total_value_difference ? formatCurrency(data.total_value_difference) : '—' }}
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
              icon="pi pi-eye"
              text
              rounded
              severity="info"
              @click.stop="handleView(data.id)"
              aria-label="View adjustment details"
            />
            <Button
              v-if="canApproveAdjustments && data.status === 'pending'"
              icon="pi pi-check"
              text
              rounded
              severity="success"
              @click.stop="handleApprove(data)"
              aria-label="Approve adjustment"
            />
            <Button
              v-if="canApproveAdjustments && data.status === 'pending'"
              icon="pi pi-times"
              text
              rounded
              severity="danger"
              @click.stop="handleReject(data)"
              aria-label="Reject adjustment"
            />
          </div>
        </template>
      </Column>

      <!-- Empty State -->
      <template #empty>
        <div class="text-center py-12">
          <i class="pi pi-inbox text-6xl text-gray-300 mb-4"></i>
          <p class="text-xl text-gray-500">No adjustments found</p>
          <p class="text-sm text-gray-400">Try adjusting your filters or create a new adjustment</p>
        </div>
      </template>

      <!-- Loading State -->
      <template #loading>
        <div class="flex items-center justify-center py-8">
          <ProgressSpinner style="width: 50px; height: 50px" />
          <span class="ml-3 text-lg">Loading adjustments...</span>
        </div>
      </template>
    </DataTable>

    <!-- Confirmation Dialogs -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Toolbar from 'primevue/toolbar';
import Card from 'primevue/card';
import Select from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Tag from 'primevue/tag';
import Chip from 'primevue/chip';
import ConfirmDialog from 'primevue/confirmdialog';
import Skeleton from 'primevue/skeleton';
import ProgressSpinner from 'primevue/progressspinner';

import { useStockAdjustment } from '../../../composables/inventory/useStockAdjustment';
import { useInventoryPermissions } from '../../../composables/inventory/useInventoryPermissions';
import type { StockAdjustment } from '../../../types/inventory';



/**
 * Props interface for AdjustmentTable component
 */
interface Props {
  branchId?: number;
  initialFilters?: {
    status?: string;
    type?: string;
    dateFrom?: Date;
    dateTo?: Date;
  };
}

const props = withDefaults(defineProps<Props>(), {
  initialFilters: () => ({}),
});

// Composables
const router = useRouter();
const { adjustments, loading, fetchAdjustments, approveAdjustment, rejectAdjustment } = useStockAdjustment();
const { canApproveAdjustments } = useInventoryPermissions();
const confirm = useConfirm();
const toast = useToast();

// Refs
const dt = ref();
const filters = ref({
  status: props.initialFilters.status || null,
  type: props.initialFilters.type || null,
  dateFrom: props.initialFilters.dateFrom || null,
  dateTo: props.initialFilters.dateTo || null,
});

// Filter options
const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const typeOptions = [
  { label: 'Physical Count', value: 'physical_count' },
  { label: 'Cycle Count', value: 'cycle_count' },
  { label: 'Damaged Goods', value: 'damaged_goods' },
  { label: 'Expired Goods', value: 'expired_goods' },
  { label: 'Found Goods', value: 'found_goods' },
  { label: 'Lost Goods', value: 'lost_goods' },
  { label: 'Return to Supplier', value: 'return_to_supplier' },
  { label: 'Write-off', value: 'write_off' },
  { label: 'Other', value: 'other' },
];

/**
 * Get status label
 */
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: 'Draft',
    pending: 'Pending Approval',
    approved: 'Approved',
    rejected: 'Rejected',
  };
  return labels[status] || status;
};

/**
 * Get status severity for Tag component
 */
const getStatusSeverity = (status: string): 'secondary' | 'warning' | 'success' | 'danger' => {
  const severities: Record<string, 'secondary' | 'warning' | 'success' | 'danger'> = {
    draft: 'secondary',
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  };
  return severities[status] || 'secondary';
};

/**
 * Get type label
 */
const getTypeLabel = (type: string): string => {
  const option = typeOptions.find((opt) => opt.value === type);
  return option?.label || type;
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
  router.push(`/inventory/adjustments/${event.data.id}`);
};

/**
 * Handle view action
 */
const handleView = (id: number): void => {
  router.push(`/inventory/adjustments/${id}`);
};

/**
 * Handle approve action
 */
const handleApprove = (adjustment: StockAdjustment): void => {
  confirm.require({
    message: `Are you sure you want to approve adjustment ${adjustment.adjustment_number}?`,
    header: 'Approve Adjustment',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-success',
    acceptLabel: 'Approve',
    rejectLabel: 'Cancel',
    accept: async () => {
      try {
        await approveAdjustment(adjustment.id, '');
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Adjustment approved successfully',
          life: 3000,
        });
        await refreshData();
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.response?.data?.message || 'Failed to approve adjustment',
          life: 3000,
        });
      }
    },
  });
};

/**
 * Handle reject action
 */
const handleReject = (adjustment: StockAdjustment): void => {
  confirm.require({
    message: `Are you sure you want to reject adjustment ${adjustment.adjustment_number}?`,
    header: 'Reject Adjustment',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Reject',
    rejectLabel: 'Cancel',
    accept: async () => {
      try {
        await rejectAdjustment(adjustment.id, 'Rejected from table view');
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Adjustment rejected',
          life: 3000,
        });
        await refreshData();
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.response?.data?.message || 'Failed to reject adjustment',
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
  await fetchAdjustments(buildFilters());
};

/**
 * Reset all filters
 */
const resetFilters = (): void => {
  filters.value = {
    status: null,
    type: null,
    dateFrom: null,
    dateTo: null,
  };
};

/**
 * Build filters object for API
 */
const buildFilters = () => {
  const apiFilters: any = {};
  if (props.branchId) apiFilters.branch_id = props.branchId;
  if (filters.value.status) apiFilters.status = filters.value.status;
  if (filters.value.type) apiFilters.adjustment_type = filters.value.type;
  if (filters.value.dateFrom) apiFilters.date_from = filters.value.dateFrom;
  if (filters.value.dateTo) apiFilters.date_to = filters.value.dateTo;
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
  await fetchAdjustments(buildFilters());
});

// Watch filters
watch(
  filters,
  async () => {
    await fetchAdjustments(buildFilters());
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
