<template>
  <div class="po-table">
    <DataTable
      v-model:filters="filters"
      :value="purchaseOrders"
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
          <p class="text-gray-500">No purchase orders found.</p>
          <Button 
            v-if="canCreatePOs"
            label="Create First PO" 
            icon="pi pi-plus" 
            @click="$emit('create')"
            class="mt-3"
          />
        </div>
      </template>

      <Column field="po_number" header="PO Number" :sortable="true" style="min-width: 150px">
        <template #body="{ data }">
          <span class="font-semibold text-blue-600">{{ data.po_number }}</span>
        </template>
      </Column>

      <Column field="supplier.supplier_name" header="Supplier" :sortable="true" style="min-width: 200px">
        <template #body="{ data }">
          <div>
            <div class="font-semibold">{{ data.supplier?.supplier_name }}</div>
            <div class="text-xs text-gray-500">{{ data.supplier?.phone }}</div>
          </div>
        </template>
      </Column>

      <Column field="branch.name" header="Branch" :sortable="true" style="min-width: 150px">
        <template #body="{ data }">
          <span>{{ data.branch?.name || 'N/A' }}</span>
        </template>
      </Column>

      <Column field="total_amount" header="Total Amount" :sortable="true" style="min-width: 160px">
        <template #body="{ data }">
          <span class="font-semibold text-green-600">{{ formatCurrency(data.total_amount) }}</span>
        </template>
      </Column>

      <Column field="order_date" header="Order Date" :sortable="true" style="min-width: 130px">
        <template #body="{ data }">
          <span class="text-sm">{{ formatDate(data.order_date) }}</span>
        </template>
      </Column>

      <Column field="expected_delivery_date" header="Expected Delivery" :sortable="true" style="min-width: 160px">
        <template #body="{ data }">
          <div>
            <div class="text-sm">{{ formatDate(data.expected_delivery_date) }}</div>
            <div v-if="isOverdue(data.expected_delivery_date, data.status)" class="text-xs text-red-600 font-semibold mt-1">
              <i class="pi pi-exclamation-triangle mr-1"></i>
              Overdue
            </div>
          </div>
        </template>
      </Column>

      <Column field="status" header="Status" :sortable="true" style="min-width: 180px">
        <template #body="{ data }">
          <div class="flex flex-col gap-1">
            <Tag :value="formatStatus(data.status)" :severity="getStatusSeverity(data.status)" />
            <div v-if="data.approvals_received?.length" class="text-xs text-gray-500">
              {{ data.approvals_received.length }}/{{ data.required_approvers.length }} approvals
            </div>
          </div>
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Dropdown
            v-model="filterModel.value"
            :options="statuses"
            placeholder="All Statuses"
            @change="filterCallback()"
            showClear
          />
        </template>
      </Column>

      <Column field="payment_status" header="Payment" :sortable="true" style="min-width: 130px">
        <template #body="{ data }">
          <Tag :value="formatPaymentStatus(data.payment_status)" :severity="getPaymentSeverity(data.payment_status)" />
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Dropdown
            v-model="filterModel.value"
            :options="paymentStatuses"
            placeholder="All Payment Statuses"
            @change="filterCallback()"
            showClear
          />
        </template>
      </Column>

      <Column header="Actions" :exportable="false" style="min-width: 200px">
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
              v-if="canApprovePOs && ['pending_approval', 'partially_approved'].includes(data.status)"
              icon="pi pi-check"
              severity="success"
              size="small"
              @click.stop="$emit('approve', data)"
              v-tooltip.top="'Approve'"
            />
            <Button
              v-if="canSendPOs && ['fully_approved', 'finance_approved'].includes(data.status)"
              icon="pi pi-send"
              severity="warning"
              size="small"
              @click.stop="$emit('send', data)"
              v-tooltip.top="'Send to Supplier'"
            />
            <Button
              v-if="canPrintPOs"
              icon="pi pi-print"
              severity="secondary"
              size="small"
              @click.stop="$emit('print', data)"
              v-tooltip.top="'Print'"
            />
            <Button
              v-if="canCancelPOs && !['cancelled', 'received'].includes(data.status)"
              icon="pi pi-times"
              severity="danger"
              size="small"
              @click.stop="$emit('cancel', data)"
              v-tooltip.top="'Cancel'"
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
import type { PurchaseOrder } from '@/types/procurement';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';

interface Props {
  purchaseOrders: PurchaseOrder[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'view', po: PurchaseOrder): void;
  (e: 'approve', po: PurchaseOrder): void;
  (e: 'send', po: PurchaseOrder): void;
  (e: 'print', po: PurchaseOrder): void;
  (e: 'cancel', po: PurchaseOrder): void;
  (e: 'create'): void;
}>();

const { canCreatePOs, canApprovePOs, canSendPOs, canPrintPOs, canCancelPOs } = useProcurementPermissions();

const filters = ref({
  status: { value: null, matchMode: FilterMatchMode.EQUALS },
  payment_status: { value: null, matchMode: FilterMatchMode.EQUALS },
});

const statuses = ['draft', 'pending_approval', 'partially_approved', 'fully_approved', 'finance_approved', 'ordered', 'partially_received', 'received', 'cancelled', 'rejected'];
const paymentStatuses = ['pending', 'partial', 'paid', 'overdue'];

const formatStatus = (status: string) => {
  return status.toUpperCase().replace(/_/g, ' ');
};

const formatPaymentStatus = (status: string) => {
  return status.toUpperCase();
};

const getStatusSeverity = (status: string) => {
  const map: Record<string, any> = {
    draft: 'secondary',
    pending_approval: 'warning',
    partially_approved: 'info',
    fully_approved: 'success',
    finance_approved: 'success',
    ordered: 'info',
    partially_received: 'warning',
    received: 'success',
    cancelled: 'danger',
    rejected: 'danger',
  };
  return map[status] || 'info';
};

const getPaymentSeverity = (status: string) => {
  const map: Record<string, any> = {
    pending: 'warning',
    partial: 'info',
    paid: 'success',
    overdue: 'danger',
  };
  return map[status] || 'info';
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const isOverdue = (date: string, status: string) => {
  if (['received', 'cancelled'].includes(status)) return false;
  return new Date(date) < new Date();
};

const onRowClick = (event: any) => {
  emit('view', event.data);
};
</script>

<style scoped>
.po-table :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

.po-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: rgba(59, 130, 246, 0.05);
}
</style>
