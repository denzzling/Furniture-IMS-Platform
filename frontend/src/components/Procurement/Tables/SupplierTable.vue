<template>
  <div class="supplier-table">
    <DataTable
      v-model:filters="filters"
      :value="suppliers"
      :loading="loading"
      :paginator="true"
      :rows="10"
      :rowsPerPageOptions="[10, 20, 50]"
      filterDisplay="row"
      :globalFilterFields="['supplier_name', 'company_name', 'contact_person', 'email', 'phone']"
      responsiveLayout="stack"
      breakpoint="960px"
      @row-click="onRowClick"
      class="p-datatable-sm"
    >
      <template #empty>
        <div class="text-center py-8">
          <i class="pi pi-inbox text-4xl text-gray-400 mb-3"></i>
          <p class="text-gray-500">No suppliers found.</p>
          <Button 
            v-if="canCreateSuppliers"
            label="Add First Supplier" 
            icon="pi pi-plus" 
            @click="$emit('create')"
            class="mt-3"
          />
        </div>
      </template>

      <Column field="supplier_code" header="Code" :sortable="true" style="min-width: 120px">
        <template #body="{ data }">
          <span class="font-semibold text-blue-600">{{ data.supplier_code }}</span>
        </template>
      </Column>

      <Column field="supplier_name" header="Supplier Name" :sortable="true" style="min-width: 200px">
        <template #body="{ data }">
          <div>
            <div class="font-semibold">{{ data.supplier_name }}</div>
            <div class="text-sm text-gray-500">{{ data.company_name }}</div>
          </div>
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            @input="filterCallback()"
            placeholder="Search name"
            class="p-column-filter"
          />
        </template>
      </Column>

      <Column field="supplier_type" header="Type" :sortable="true" style="min-width: 150px">
        <template #body="{ data }">
          <Tag :value="formatSupplierType(data.supplier_type)" severity="info" />
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Dropdown
            v-model="filterModel.value"
            :options="supplierTypes"
            placeholder="All Types"
            @change="filterCallback()"
            showClear
          />
        </template>
      </Column>

      <Column field="contact_person" header="Contact" style="min-width: 150px">
        <template #body="{ data }">
          <div v-if="data.contact_person">
            <div class="text-sm">{{ data.contact_person }}</div>
          </div>
        </template>
      </Column>

      <Column field="phone" header="Phone" style="min-width: 130px">
        <template #body="{ data }">
          <div class="text-sm">{{ data.phone }}</div>
        </template>
      </Column>

      <Column field="email" header="Email" style="min-width: 180px">
        <template #body="{ data }">
          <div class="text-sm">{{ data.email }}</div>
        </template>
      </Column>

      <Column field="rating" header="Rating" :sortable="true" style="min-width: 150px">
        <template #body="{ data }">
          <Rating v-model="data.rating" :readonly="true" :stars="5" :cancel="false" />
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputNumber
            v-model="filterModel.value"
            placeholder="Min rating"
            @input="filterCallback()"
            :min="0"
            :max="5"
            :step="0.5"
          />
        </template>
      </Column>

      <Column field="total_orders" header="Total Orders" :sortable="true" style="min-width: 130px">
        <template #body="{ data }">
          <span class="font-semibold">{{ data.total_orders }}</span>
        </template>
      </Column>

      <Column field="total_amount_purchased" header="Total Purchased" :sortable="true" style="min-width: 160px">
        <template #body="{ data }">
          <span class="font-semibold text-green-600">{{ formatCurrency(data.total_amount_purchased) }}</span>
        </template>
      </Column>

      <Column field="payment_terms" header="Payment Terms" style="min-width: 150px">
        <template #body="{ data }">
          <span class="text-sm">{{ formatPaymentTerms(data.payment_terms) }}</span>
        </template>
      </Column>

      <Column field="status" header="Status" :sortable="true" style="min-width: 120px">
        <template #body="{ data }">
          <Tag 
            :value="data.status.toUpperCase()" 
            :severity="getStatusSeverity(data.status)" 
          />
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

      <Column header="Actions" :exportable="false" style="min-width: 150px">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button
              icon="pi pi-eye"
              severity="info"
              size="small"
              @click.stop="$emit('view', data)"
              v-tooltip.top="'View'"
            />
            <Button
              v-if="canEditSuppliers"
              icon="pi pi-pencil"
              severity="warning"
              size="small"
              @click.stop="$emit('edit', data)"
              v-tooltip.top="'Edit'"
            />
            <Button
              icon="pi pi-chart-line"
              severity="success"
              size="small"
              @click.stop="$emit('performance', data)"
              v-tooltip.top="'View Performance'"
            />
            <Button
              v-if="canDeleteSuppliers"
              icon="pi pi-trash"
              severity="danger"
              size="small"
              @click.stop="$emit('delete', data)"
              v-tooltip.top="'Delete'"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { FilterMatchMode } from 'primevue/api';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Rating from 'primevue/rating';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import type { Supplier } from '@/types/procurement';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';

interface Props {
  suppliers: Supplier[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'view', supplier: Supplier): void;
  (e: 'edit', supplier: Supplier): void;
  (e: 'delete', supplier: Supplier): void;
  (e: 'performance', supplier: Supplier): void;
  (e: 'create'): void;
}>();

const { canCreateSuppliers, canEditSuppliers, canDeleteSuppliers } = useProcurementPermissions();

const filters = ref({
  supplier_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  supplier_type: { value: null, matchMode: FilterMatchMode.EQUALS },
  status: { value: null, matchMode: FilterMatchMode.EQUALS },
  rating: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
});

const supplierTypes = [
  'manufacturer',
  'wholesaler',
  'distributor',
  'importer',
  'local_artisan',
];

const statuses = ['active', 'inactive', 'blacklisted'];

const formatSupplierType = (type: string) => {
  const typeMap: Record<string, string> = {
    manufacturer: 'Manufacturer',
    wholesaler: 'Wholesaler',
    distributor: 'Distributor',
    importer: 'Importer',
    local_artisan: 'Local Artisan',
  };
  return typeMap[type] || type;
};

const formatPaymentTerms = (terms: string) => {
  const termsMap: Record<string, string> = {
    cash_on_delivery: 'Cash on Delivery (COD)',
    net_7: 'Net 7 Days',
    net_15: 'Net 15 Days',
    net_30: 'Net 30 Days',
    net_60: 'Net 60 Days',
    advance_payment: 'Advance Payment',
  };
  return termsMap[terms] || terms;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value);
};

const getStatusSeverity = (status: string) => {
  const severityMap: Record<string, any> = {
    active: 'success',
    inactive: 'secondary',
    blacklisted: 'danger',
  };
  return severityMap[status] || 'info';
};

const onRowClick = (event: any) => {
  emit('view', event.data);
};
</script>

<style scoped>
.supplier-table :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

.supplier-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: rgba(59, 130, 246, 0.05);
}
</style>
