<template>
  <div class="inventory-table-container">
    <!-- Toolbar with Export -->
    <Toolbar class="mb-4">
      <template #start>
        <h2 class="text-xl font-semibold">Inventory Items</h2>
      </template>
      <template #end>
        <Button 
          label="Export" 
          icon="pi pi-download" 
          @click="exportCSV" 
          outlined
          aria-label="Export inventory to CSV"
        />
      </template>
    </Toolbar>

    <!-- DataTable -->
    <DataTable
      ref="dt"
      v-model:selection="selectedItems"
      :value="inventoryItems"
      :loading="loading"
      :paginator="true"
      :rows="15"
      :rows-per-page-options="[10, 15, 25, 50]"
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageSelect"
      current-page-report-template="Showing {first} to {last} of {totalRecords} items"
      responsive-layout="stack"
      breakpoint="960px"
      striped-rows
      hover-rows
      :global-filter-fields="['product.product_name', 'product.sku', 'bin_code']"
      class="shadow-sm"
    >
      <!-- Selection Column -->
      <Column selection-mode="multiple" header-style="width: 3rem" :exportable="false" />

      <!-- Product Column -->
      <Column field="product.product_name" header="Product" sortable style="min-width: 250px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="3rem" />
          </div>
          <div v-else class="flex items-center gap-3">
            <Avatar
              v-if="data.product?.image_url"
              :image="data.product.image_url"
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
                {{ data.product?.product_name || 'N/A' }}
              </span>
              <span class="text-sm text-gray-500">
                SKU: {{ data.product?.sku || 'N/A' }}
              </span>
            </div>
          </div>
        </template>
      </Column>

      <!-- Variation Column (Hidden on tablet/mobile) -->
      <Column 
        field="variation.variation_name" 
        header="Variation" 
        sortable 
        class="hidden md:table-cell"
        style="min-width: 150px"
      >
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else class="text-gray-700">
            {{ data.variation?.variation_name || '—' }}
          </span>
        </template>
      </Column>

      <!-- On Hand Column -->
      <Column field="quantity_on_hand" header="On Hand" sortable style="min-width: 120px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else class="text-lg font-bold text-gray-900">
            {{ data.quantity_on_hand }}
          </span>
        </template>
      </Column>

      <!-- Available Column -->
      <Column field="quantity_available" header="Available" sortable style="min-width: 120px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span 
            v-else 
            class="font-semibold"
            :class="{
              'text-green-600': !isLowStock(data) && !isOutOfStock(data),
              'text-orange-500': isLowStock(data),
              'text-red-600': isOutOfStock(data)
            }"
          >
            {{ data.quantity_available }}
          </span>
        </template>
      </Column>

      <!-- Reserved Column (Hidden on tablet/mobile) -->
      <Column 
        field="quantity_reserved" 
        header="Reserved" 
        sortable 
        class="hidden md:table-cell"
        style="min-width: 120px"
      >
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else class="text-gray-700">
            {{ data.quantity_reserved }}
          </span>
        </template>
      </Column>

      <!-- Damaged Column (Hidden on tablet/mobile) -->
      <Column 
        field="quantity_damaged" 
        header="Damaged" 
        sortable 
        class="hidden md:table-cell"
        style="min-width: 120px"
      >
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span 
            v-else 
            :class="data.quantity_damaged > 0 ? 'text-red-600 font-semibold' : 'text-gray-700'"
          >
            {{ data.quantity_damaged }}
          </span>
        </template>
      </Column>

      <!-- Stock Status Column -->
      <Column field="stock_status" header="Stock Status" sortable style="min-width: 150px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <StockStatusBadge v-else :status="data.stock_status" />
        </template>
      </Column>

      <!-- Location Column -->
      <Column header="Location" style="min-width: 200px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <LocationDisplay
            v-else
            :warehouse-section="data.warehouse_section"
            :aisle="data.aisle"
            :rack="data.rack"
            :shelf="data.shelf"
            :bin-code="data.bin_code"
          />
        </template>
      </Column>

      <!-- Value Column -->
      <Column field="total_value" header="Value" sortable style="min-width: 150px">
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <span v-else class="font-medium text-gray-900">
            {{ data.total_value ? formatCurrency(data.total_value) : '—' }}
          </span>
        </template>
      </Column>

      <!-- Actions Column -->
      <Column 
        v-if="showActions" 
        :exportable="false" 
        header="Actions" 
        style="min-width: 100px"
      >
        <template #body="{ data }">
          <div v-if="loading">
            <Skeleton width="100%" height="2rem" />
          </div>
          <div v-else>
            <Button
              icon="pi pi-ellipsis-v"
              text
              rounded
              @click="toggleMenu($event, data.id)"
              aria-label="Open actions menu"
              aria-haspopup="true"
            />
          </div>
        </template>
      </Column>

      <!-- Empty State -->
      <template #empty>
        <div class="text-center py-12">
          <i class="pi pi-box text-6xl text-gray-300 mb-4"></i>
          <p class="text-xl text-gray-500">No inventory items found</p>
          <p class="text-sm text-gray-400">Try adjusting your filters or add new inventory</p>
        </div>
      </template>

      <!-- Loading State -->
      <template #loading>
        <div class="flex items-center justify-center py-8">
          <i class="pi pi-spinner pi-spin text-4xl text-primary"></i>
          <span class="ml-3 text-lg">Loading inventory...</span>
        </div>
      </template>
    </DataTable>

    <!-- Action Menu -->
    <Menu ref="menu" :model="menuItems" :popup="true" />

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Toolbar from 'primevue/toolbar';
import Menu from 'primevue/menu';
import Avatar from 'primevue/avatar';
import ConfirmDialog from 'primevue/confirmdialog';
import Skeleton from 'primevue/skeleton';
import { useInventory } from '../../../composables/inventory/useInventory';
import { useInventoryPermissions } from '../../../composables/inventory/useInventoryPermissions';
import StockStatusBadge from '../Widgets/StockLevelBadge.vue';
import LocationDisplay from '../Widgets/LocationDisplay.vue';
import type { BranchInventory } from '../../../types/inventory';


/**
 * Props interface for InventoryTable component
 */
interface Props {
  branchId: number;
  filters?: {
    search?: string;
    stock_status?: string;
    warehouse_section?: string;
  };
  showActions?: boolean;
}

/**
 * Props definition with defaults
 */
const props = withDefaults(defineProps<Props>(), {
  filters: () => ({}),
  showActions: true,
});

// Composables
const { 
  inventoryItems, 
  loading, 
  fetchInventory, 
  deleteInventory,
  navigateToEdit,
  navigateToDetail,
  isLowStock,
  isOutOfStock
} = useInventory();

const { 
  canEditInventory, 
  canDeleteInventory 
} = useInventoryPermissions();

const confirm = useConfirm();
const toast = useToast();

// Refs
const dt = ref();
const menu = ref();
const selectedItems = ref<BranchInventory[]>([]);
const selectedId = ref<number | null>(null);

/**
 * Menu items with permission-based visibility
 */
const menuItems = computed(() => {
  const items = [
    {
      label: 'View Details',
      icon: 'pi pi-eye',
      command: () => {
        if (selectedId.value) handleView(selectedId.value);
      },
    },
  ];

  if (canEditInventory.value) {
    items.push({
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: () => {
        if (selectedId.value) handleEdit(selectedId.value);
      },
    });
  }

  if (canDeleteInventory.value) {
    items.push(
      { separator: true } as any,
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => {
          if (selectedId.value) confirmDelete(selectedId.value);
        },
        class: 'text-red-500',
      }
    );
  }

  return items;
});

/**
 * Format number as Philippine Peso currency
 * @param value - Amount to format
 * @returns Formatted currency string
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value);
};

/**
 * Navigate to detail view
 * @param id - Inventory item ID
 */
const handleView = (id: number): void => {
  navigateToDetail(id);
};

/**
 * Navigate to edit view
 * @param id - Inventory item ID
 */
const handleEdit = (id: number): void => {
  navigateToEdit(id);
};

/**
 * Show delete confirmation dialog
 * @param id - Inventory item ID
 */
const confirmDelete = (id: number): void => {
  confirm.require({
    message: 'Are you sure you want to delete this inventory record? This action cannot be undone.',
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    accept: () => handleDelete(id),
  });
};

/**
 * Delete inventory item
 * @param id - Inventory item ID
 */
const handleDelete = async (id: number): Promise<void> => {
  try {
    await deleteInventory(id);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Inventory record deleted successfully',
      life: 3000,
    });
    await fetchInventory(props.branchId, props.filters);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to delete inventory record',
      life: 3000,
    });
  }
};

/**
 * Toggle action menu for specific item
 * @param event - Click event
 * @param id - Inventory item ID
 */
const toggleMenu = (event: Event, id: number): void => {
  menu.value.toggle(event);
  selectedId.value = id;
};

/**
 * Export table data to CSV
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

/**
 * Fetch inventory data on component mount
 */
onMounted(async () => {
  await fetchInventory(props.branchId, props.filters);
});

/**
 * Watch for filter changes and refetch data
 */
watch(
  () => props.filters,
  async (newFilters) => {
    await fetchInventory(props.branchId, newFilters);
  },
  { deep: true }
);

/**
 * Watch for branch ID changes and refetch data
 */
watch(
  () => props.branchId,
  async (newBranchId) => {
    await fetchInventory(newBranchId, props.filters);
  }
);
</script>

<style scoped>
/* Ensure responsive stacking on mobile */
@media (max-width: 960px) {
  :deep(.p-datatable-tbody > tr > td) {
    text-align: left;
    display: block;
    border: 0 none;
    width: 100% !important;
  }

  :deep(.p-datatable-tbody > tr > td:before) {
    content: attr(data-label);
    display: inline-block;
    font-weight: bold;
    margin-right: 0.5rem;
  }
}

/* Action menu item styling */
:deep(.p-menuitem-link.text-red-500) {
  color: #ef4444 !important;
}

:deep(.p-menuitem-link.text-red-500:hover) {
  background-color: #fee2e2 !important;
}
</style>
