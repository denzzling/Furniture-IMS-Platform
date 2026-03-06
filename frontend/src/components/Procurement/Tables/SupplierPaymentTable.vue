<template>
  <div class="payment-table">
    <DataTable
      v-model:filters="filters"
      :value="payments"
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
          <p class="text-gray-500">No payments found.</p>
        </div>
      </template>

      <Column field="payment_number" header="Payment #" :sortable="true" style="min-width: 150px">
        <template #body="{ data }">
          <span class="font-semibold text-blue-600">{{ data.payment_number }}</span>
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

      <Column field="purchase_order.po_number" header="PO Number" style="min-width: 150px">
        <template #body="{ data }">
          <span class="font-semibold">{{ data.purchase_order?.po_number }}</span>
        </template>
      </Column>

      <Column field="payment_amount" header="Amount" :sortable="true" style="min-width: 160px">
        <template #body="{ data }">
          <span class="font-semibold text-green-600">{{ formatCurrency(data.payment_amount) }}</span>
        </template>
      </Column>

      <Column field="payment_method" header="Payment Method" style="min-width: 150px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <i :class="getPaymentMethodIcon(data.payment_method)" class="text-blue-600"></i>
            <span class="text-sm">{{ formatPaymentMethod(data.payment_method) }}</span>
          </div>
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Dropdown
            v-model="filterModel.value"
            :options="paymentMethods"
            placeholder="All Methods"
            @change="filterCallback()"
            showClear
          />
        </template>
      </Column>

      <Column field="payment_date" header="Payment Date" :sortable="true" style="min-width: 130px">
        <template #body="{ data }">
          <span class="text-sm">{{ formatDate(data.payment_date) }}</span>
        </template>
      </Column>

      <Column field="status" header="Status" :sortable="true" style="min-width: 170px">
        <template #body="{ data }">
          <div class="flex flex-col gap-1">
            <Tag :value="formatStatus(data.status)" :severity="getStatusSeverity(data.status)" />
            <div v-if="data.approved_at && !data.processed_at" class="text-xs text-gray-500 flex items-center gap-1">
              <i class="pi pi-check-circle text-green-500"></i>
              Approved
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

      <Column field="reference_number" header="Reference" style="min-width: 150px">
        <template #body="{ data }">
          <span class="text-sm">{{ data.reference_number || 'N/A' }}</span>
        </template>
      </Column>

      <Column field="processed_by_user.name" header="Processed By" style="min-width: 150px">
        <template #body="{ data }">
          <span class="text-sm">{{ data.processed_by_user?.name || 'N/A' }}</span>
        </template>
      </Column>

      <Column header="Actions" :exportable="false" style="min-width: 180px">
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
              v-if="canApprovePayments && data.status === 'pending_approval'"
              icon="pi pi-check"
              severity="success"
              size="small"
              @click.stop="$emit('approve', data)"
              v-tooltip.top="'Approve'"
            />
            <Button
              v-if="canProcessPayments && data.status === 'approved'"
              icon="pi pi-play"
              severity="warning"
              size="small"
              @click.stop="$emit('process', data)"
              v-tooltip.top="'Process Payment'"
            />
            <Button
              v-if="data.status === 'pending_approval'"
              icon="pi pi-times"
              severity="danger"
              size="small"
              @click.stop="$emit('reject', data)"
              v-tooltip.top="'Reject'"
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
import type { SupplierPayment } from '@/types/procurement';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';

interface Props {
  payments: SupplierPayment[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'view', payment: SupplierPayment): void;
  (e: 'approve', payment: SupplierPayment): void;
  (e: 'process', payment: SupplierPayment): void;
  (e: 'reject', payment: SupplierPayment): void;
}>();

const { canApprovePayments, canProcessPayments } = useProcurementPermissions();

const filters = ref({
  payment_method: { value: null, matchMode: FilterMatchMode.EQUALS },
  status: { value: null, matchMode: FilterMatchMode.EQUALS },
});

const paymentMethods = ['cash', 'check', 'bank_transfer', 'credit_card', 'debit_card', 'online_payment'];
const statuses = ['pending_approval', 'approved', 'processing', 'completed', 'failed', 'cancelled'];

const formatPaymentMethod = (method: string) => {
  const map: Record<string, string> = {
    cash: 'Cash',
    check: 'Check',
    bank_transfer: 'Bank Transfer',
    credit_card: 'Credit Card',
    debit_card: 'Debit Card',
    online_payment: 'Online Payment',
  };
  return map[method] || method;
};

const getPaymentMethodIcon = (method: string) => {
  const iconMap: Record<string, string> = {
    cash: 'pi pi-money-bill',
    check: 'pi pi-file',
    bank_transfer: 'pi pi-building',
    credit_card: 'pi pi-credit-card',
    debit_card: 'pi pi-credit-card',
    online_payment: 'pi pi-globe',
  };
  return iconMap[method] || 'pi pi-wallet';
};

const formatStatus = (status: string) => {
  return status.toUpperCase().replace(/_/g, ' ');
};

const getStatusSeverity = (status: string) => {
  const map: Record<string, any> = {
    pending_approval: 'warning',
    approved: 'info',
    processing: 'info',
    completed: 'success',
    failed: 'danger',
    cancelled: 'danger',
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

const onRowClick = (event: any) => {
  emit('view', event.data);
};
</script>

<style scoped>
.payment-table :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

.payment-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: rgba(59, 130, 246, 0.05);
}
</style>
