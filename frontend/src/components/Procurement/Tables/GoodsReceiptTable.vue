<template>
  <div class="grn-table">
    <DataTable
      v-model:filters="filters"
      :value="receipts"
      :loading="loading"
      :paginator="true"
      :rows="10"
      :rowsPerPageOptions="[10, 20, 50]"
      filterDisplay="row"
      responsiveLayout="stack"
      breakpoint="960px"
      @row-click="onRowClick"
      class="p-datatable-sm"
    >
      <template #empty>
        <div class="text-center py-8">
          <i class="pi pi-inbox text-4xl text-gray-400 mb-3"></i>
          <p class="text-gray-500">No goods receipts found.</p>
          <Button 
            v-if="canCreateReceipts"
            label="Create First GRN" 
            icon="pi pi-plus" 
            @click="$emit('create')"
            class="mt-3"
          />
        </div>
      </template>

      <Column field="grn_number" header="GRN Number" :sortable="true" style="min-width: 150px">
        <template #body="{ data }">
          <span class="font-semibold text-blue-600">{{ data.grn_number }}</span>
        </template>
      </Column>

      <Column field="purchase_order.po_number" header="PO Number" :sortable="true" style="min-width: 150px">
        <template #body="{ data }">
          <span class="font-semibold">{{ data.purchase_order?.po_number }}</span>
        </template>
      </Column>

      <Column field="purchase_order.supplier.supplier_name" header="Supplier" style="min-width: 180px">
        <template #body="{ data }">
          <span>{{ data.purchase_order?.supplier?.supplier_name }}</span>
        </template>
      </Column>

      <Column field="branch.name" header="Branch" :sortable="true" style="min-width: 150px">
        <template #body="{ data }">
          <span>{{ data.branch?.name || 'N/A' }}</span>
        </template>
      </Column>

      <Column field="receipt_date" header="Receipt Date" :sortable="true" style="min-width: 150px">
        <template #body="{ data }">
          <div>
            <div class="text-sm">{{ formatDate(data.receipt_date) }}</div>
            <div class="text-xs text-gray-500">{{ data.receipt_time }}</div>
          </div>
        </template>
      </Column>

      <Column field="receipt_status" header="Status" :sortable="true" style="min-width: 130px">
        <template #body="{ data }">
          <div class="flex flex-col gap-1">
            <Tag :value="formatReceiptStatus(data.receipt_status)" :severity="getReceiptSeverity(data.receipt_status)" />
            <div v-if="data.discrepancy_notes" class="flex items-center gap-1 text-xs text-orange-600">
              <i class="pi pi-exclamation-circle"></i>
              Discrepancy
            </div>
          </div>
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Dropdown
            v-model="filterModel.value"
            :options="receiptStatuses"
            placeholder="All Statuses"
            @change="filterCallback()"
            showClear
          />
        </template>
      </Column>

      <Column field="received_by_user.name" header="Received By" style="min-width: 150px">
        <template #body="{ data }">
          <span class="text-sm">{{ data.received_by_user?.name || 'N/A' }}</span>
        </template>
      </Column>

      <Column field="verified_at" header="Verified" :sortable="true" style="min-width: 150px">
        <template #body="{ data }">
          <div v-if="data.verified_at">
            <Tag value="VERIFIED" severity="success" />
            <div class="text-xs text-gray-500 mt-1">{{ data.verified_by_user?.name }}</div>
          </div>
          <Tag v-else value="PENDING" severity="warning" />
        </template>
      </Column>

      <Column header="Actions" :exportable="false" style="min-width: 150px">
        <template #body="{ data }">
          <div class="flex gap-2 flex-wrap">
            <Button
              icon="pi pi-eye"
              severity="info"
              size="small"
              @click.stop="$emit('view', data)"
              v-tooltip.top="'View'"
            />
            <Button
              v-if="canVerifyReceipts && !data.verified_at"
              icon="pi pi-check-circle"
              severity="success"
              size="small"
              @click.stop="$emit('verify', data)"
              v-tooltip.top="'Verify'"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FilterMatchMode } from 'primevue/api';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';
import type { GoodsReceipt } from '@/types/procurement';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';

interface Props {
  receipts: GoodsReceipt[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'view', receipt: GoodsReceipt): void;
  (e: 'verify', receipt: GoodsReceipt): void;
  (e: 'create'): void;
}>();

const { canCreateReceipts, canVerifyReceipts } = useProcurementPermissions();

const filters = ref({
  receipt_status: { value: null, matchMode: FilterMatchMode.EQUALS },
});

const receiptStatuses = ['full', 'partial', 'damaged', 'rejected'];

const formatReceiptStatus = (status: string) => {
  const map: Record<string, string> = {
    full: 'FULL',
    partial: 'PARTIAL',
    damaged: 'DAMAGED',
    rejected: 'REJECTED',
  };
  return map[status] || status.toUpperCase();
};

const getReceiptSeverity = (status: string) => {
  const map: Record<string, any> = {
    full: 'success',
    partial: 'warning',
    damaged: 'danger',
    rejected: 'danger',
  };
  return map[status] || 'info';
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const onRowClick = (event: any) => {
  emit('view', event.data);
};
</script>

<style scoped>
.grn-table :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

.grn-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: rgba(59, 130, 246, 0.05);
}
</style>
