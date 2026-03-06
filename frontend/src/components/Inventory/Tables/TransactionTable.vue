<template>
  <div class="transaction-table-container">
    <!-- Toolbar -->
    <Toolbar class="mb-4">
      <template #start>
        <h2 class="text-xl font-semibold">Inventory Transactions</h2>
      </template>
      <template #end>
        <div class="flex gap-2">
          <Button 
            icon="pi pi-refresh" 
            outlined 
            @click="refreshData"
            aria-label="Refresh transactions"
          />
          <Button 
            label="Export to Excel" 
            icon="pi pi-file-excel" 
            severity="success"
            outlined 
            @click="exportExcel"
            aria-label="Export transactions to Excel"
          />
        </div>
      </template>
    </Toolbar>

    <!-- Filters -->
    <Card class="mb-4">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label for="type-filter" class="block text-sm font-medium mb-2">Transaction Type</label>
            <Select
              id="type-filter"
              v-model="filters.transactionType"
              :options="typeOptions"
              option-label="label"
              option-value="value"
              placeholder="All Types"
              class="w-full"
              show-clear
            />
          </div>
          <div>
            <label for="branch-filter" class="block text-sm font-medium mb-2">Branch</label>
            <Select
              id="branch-filter"
              v-model="filters.branch"
              :options="branchOptions"
              option-label="label"
              option-value="value"
              placeholder="All Branches"
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
      :value="transactions"
      :loading="loading"
      :paginator="true"
      :rows="15"
      :rows-per-page-options="[10, 15, 25, 50]"
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageSelect"
      current-page-report-template="Showing {first} to {last} of {totalRecords} transactions"
      responsive-layout="stack"
      breakpoint="960px"
      striped-rows
      hover-rows
      class="shadow-sm"
    >
      <!-- Transaction Number -->
      <Column field="transaction_number" header="Transaction #" sortable style="min-width: 170px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else class="font-mono text-sm text-primary">
            {{ data.transaction_number }}
          </span>
        </template>
      </Column>

      <!-- Date/Time -->
      <Column field="transaction_date" header="Date/Time" sortable style="min-width: 180px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <div v-else class="flex flex-col">
            <span class="font-medium">{{ formatDate(data.transaction_date) }}</span>
            <span class="text-xs text-gray-500">{{ formatTime(data.transaction_date) }}</span>
          </div>
        </template>
      </Column>

      <!-- Type -->
      <Column field="transaction_type" header="Type" sortable style="min-width: 200px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <div v-else class="flex items-center gap-2">
            <TransactionTypeIcon :type="data.transaction_type" />
            <span class="text-sm">{{ getTypeLabel(data.transaction_type) }}</span>
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

      <!-- Qty Before -->
      <Column field="quantity_before" header="Qty Before" sortable style="min-width: 120px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else class="font-medium text-gray-700">
            {{ data.quantity_before }}
          </span>
        </template>
      </Column>

      <!-- Change -->
      <Column field="quantity_change" header="Change" sortable style="min-width: 120px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span
            v-else
            class="font-bold"
            :class="{
              'text-green-600': data.quantity_change > 0,
              'text-red-600': data.quantity_change < 0,
              'text-gray-600': data.quantity_change === 0
            }"
          >
            {{ data.quantity_change > 0 ? '+' : '' }}{{ data.quantity_change }}
          </span>
        </template>
      </Column>

      <!-- Qty After -->
      <Column field="quantity_after" header="Qty After" sortable style="min-width: 120px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else class="font-semibold text-gray-900">
            {{ data.quantity_after }}
          </span>
        </template>
      </Column>

      <!-- Unit Cost -->
      <Column field="unit_cost" header="Unit Cost" sortable style="min-width: 130px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else class="text-gray-700">
            {{ data.unit_cost ? formatCurrency(data.unit_cost) : '—' }}
          </span>
        </template>
      </Column>

      <!-- Total Value -->
      <Column field="total_value" header="Total Value" sortable style="min-width: 150px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span
            v-else
            class="font-semibold"
            :class="{
              'text-green-600': data.total_value > 0,
              'text-red-600': data.total_value < 0,
              'text-gray-600': data.total_value === 0
            }"
          >
            {{ data.total_value ? formatCurrency(Math.abs(data.total_value)) : '—' }}
          </span>
        </template>
      </Column>

      <!-- Created By -->
      <Column field="created_by" header="Created By" style="min-width: 150px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <div v-else class="flex items-center gap-2">
            <i class="pi pi-user text-gray-500 text-sm"></i>
            <span class="text-sm">{{ data.created_by?.name || 'System' }}</span>
          </div>
        </template>
      </Column>

      <!-- Empty State -->
      <template #empty>
        <div class="text-center py-12">
          <i class="pi pi-history text-6xl text-gray-300 mb-4"></i>
          <p class="text-xl text-gray-500">No transactions found</p>
          <p class="text-sm text-gray-400">Try adjusting your filters</p>
        </div>
      </template>

      <!-- Loading State -->
      <template #loading>
        <div class="flex items-center justify-center py-8">
          <ProgressSpinner style="width: 50px; height: 50px" />
          <span class="ml-3 text-lg">Loading transactions...</span>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Toolbar from 'primevue/toolbar';
import Card from 'primevue/card';
import Select from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Avatar from 'primevue/avatar';
import Skeleton from 'primevue/skeleton';
import ProgressSpinner from 'primevue/progressspinner';

import type { InventoryTransaction } from '../../../types/inventory';
import inventoryApi from '../../../services/api/inventory';
import TransactionTypeIcon from '../Widgets/TransactionTypeIcon.vue';

/**
 * Props interface for TransactionTable component
 */
interface Props {
  branchId?: number;
  inventoryId?: number;
  initialFilters?: {
    transactionType?: string;
    branch?: number;
    dateFrom?: Date;
    dateTo?: Date;
  };
}

const props = withDefaults(defineProps<Props>(), {
  initialFilters: () => ({}),
});

// Composables
const toast = useToast();

// Refs
const dt = ref();
const transactions = ref<InventoryTransaction[]>([]);
const loading = ref(false);

const filters = ref({
  transactionType: props.initialFilters.transactionType || null,
  branch: props.initialFilters.branch || null,
  dateFrom: props.initialFilters.dateFrom || null,
  dateTo: props.initialFilters.dateTo || null,
});

// Filter options
const typeOptions = [
  { label: 'Purchase Receive', value: 'purchase_receive' },
  { label: 'Sales Order', value: 'sales_order' },
  { label: 'Stock Adjustment', value: 'stock_adjustment' },
  { label: 'Transfer Out', value: 'transfer_out' },
  { label: 'Transfer In', value: 'transfer_in' },
  { label: 'Return to Supplier', value: 'return_to_supplier' },
  { label: 'Customer Return', value: 'customer_return' },
  { label: 'Damaged Goods', value: 'damaged_goods' },
  { label: 'Write-off', value: 'write_off' },
  { label: 'Found Goods', value: 'found_goods' },
  { label: 'Initial Stock', value: 'initial_stock' },
];

const branchOptions = ref<Array<{ label: string; value: number }>>([]);

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
 * Format time
 */
const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
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
 * Fetch transactions from API
 */
const fetchTransactions = async (apiFilters: any = {}): Promise<void> => {
  try {
    loading.value = true;
    const response = await inventoryApi.getTransactions(apiFilters);
    transactions.value = response.data;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to fetch transactions',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

/**
 * Refresh data
 */
const refreshData = async (): Promise<void> => {
  await fetchTransactions(buildFilters());
};

/**
 * Reset all filters
 */
const resetFilters = (): void => {
  filters.value = {
    transactionType: null,
    branch: null,
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
  if (props.inventoryId) apiFilters.inventory_id = props.inventoryId;
  if (filters.value.transactionType) apiFilters.transaction_type = filters.value.transactionType;
  if (filters.value.branch) apiFilters.branch_id = filters.value.branch;
  if (filters.value.dateFrom) apiFilters.date_from = filters.value.dateFrom;
  if (filters.value.dateTo) apiFilters.date_to = filters.value.dateTo;
  return apiFilters;
};

/**
 * Export table to Excel
 */
const exportExcel = (): void => {
  dt.value.exportCSV();
  toast.add({
    severity: 'info',
    summary: 'Export Started',
    detail: 'Downloading Excel file...',
    life: 3000,
  });
};

// Lifecycle hooks
onMounted(async () => {
  await fetchTransactions(buildFilters());
});

// Watch filters
watch(
  filters,
  async () => {
    await fetchTransactions(buildFilters());
  },
  { deep: true }
);
</script>
