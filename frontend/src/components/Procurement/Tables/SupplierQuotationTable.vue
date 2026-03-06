<template>
  <div class="quotation-table">
    <DataTable
      v-model:filters="filters"
      :value="quotations"
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
          <p class="text-gray-500">No quotations found.</p>
        </div>
      </template>

      <Column field="quotation_number" header="Quotation #" :sortable="true" style="min-width: 150px">
        <template #body="{ data }">
          <span class="font-semibold text-blue-600">{{ data.quotation_number }}</span>
        </template>
      </Column>

      <Column field="supplier.supplier_name" header="Supplier" :sortable="true" style="min-width: 200px">
        <template #body="{ data }">
          <div>
            <div class="font-semibold">{{ data.supplier?.supplier_name }}</div>
            <Rating v-if="data.supplier" v-model="data.supplier.rating" :readonly="true" :stars="5" :cancel="false" class="text-xs" />
          </div>
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            @input="filterCallback()"
            placeholder="Search supplier"
            class="p-column-filter"
          />
        </template>
      </Column>

      <Column field="rfq.rfq_number" header="RFQ" style="min-width: 150px">
        <template #body="{ data }">
          <span class="text-sm">{{ data.rfq?.rfq_number || 'N/A' }}</span>
        </template>
      </Column>

      <Column field="total_amount" header="Total Amount" :sortable="true" style="min-width: 160px">
        <template #body="{ data }">
          <div>
            <div class="font-semibold text-green-600">{{ formatCurrency(data.total_amount) }}</div>
            <div v-if="data.is_best_price" class="text-xs text-green-600 font-semibold flex items-center gap-1 mt-1">
              <i class="pi pi-star-fill text-yellow-500"></i>
              Best Price
            </div>
          </div>
        </template>
      </Column>

      <Column field="delivery_days" header="Delivery" :sortable="true" style="min-width: 120px">
        <template #body="{ data }">
          <Tag :value="`${data.delivery_days} days`" severity="info" />
        </template>
      </Column>

      <Column field="payment_terms" header="Payment Terms" style="min-width: 150px">
        <template #body="{ data }">
          <span class="text-sm">{{ data.payment_terms }}</span>
        </template>
      </Column>

      <Column field="valid_until" header="Valid Until" :sortable="true" style="min-width: 160px">
        <template #body="{ data }">
          <div>
            <div class="text-sm">{{ formatDate(data.valid_until) }}</div>
            <div v-if="isExpired(data.valid_until)" class="text-xs text-red-600 font-semibold mt-1">
              Expired
            </div>
            <div v-else-if="isExpiringSoon(data.valid_until)" class="text-xs text-orange-500 mt-1">
              Expiring soon
            </div>
          </div>
        </template>
      </Column>

      <Column field="status" header="Status" :sortable="true" style="min-width: 150px">
        <template #body="{ data }">
          <Tag :value="formatStatus(data.status)" :severity="getStatusSeverity(data.status)" />
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

      <Column field="evaluation_score" header="Score" :sortable="true" style="min-width: 120px">
        <template #body="{ data }">
          <div v-if="data.evaluation_score !== null && data.evaluation_score !== undefined">
            <Tag 
              :value="`${data.evaluation_score}/100`" 
              :severity="getScoreSeverity(data.evaluation_score)"
            />
          </div>
          <span v-else class="text-sm text-gray-400">Not evaluated</span>
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
              v-if="canEvaluateQuotations && data.status === 'submitted'"
              icon="pi pi-chart-bar"
              severity="warning"
              size="small"
              @click.stop="$emit('evaluate', data)"
              v-tooltip.top="'Evaluate'"
            />
            <Button
              v-if="canAcceptQuotations && data.status === 'under_evaluation'"
              icon="pi pi-check"
              severity="success"
              size="small"
              @click.stop="$emit('accept', data)"
              v-tooltip.top="'Accept'"
            />
            <Button
              v-if="canRejectQuotations && ['submitted', 'under_evaluation'].includes(data.status)"
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
import Rating from 'primevue/rating';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import type { SupplierQuotation } from '@/types/procurement';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';

interface Props {
  quotations: SupplierQuotation[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'view', quotation: SupplierQuotation): void;
  (e: 'evaluate', quotation: SupplierQuotation): void;
  (e: 'accept', quotation: SupplierQuotation): void;
  (e: 'reject', quotation: SupplierQuotation): void;
}>();

const { canEvaluateQuotations, canAcceptQuotations, canRejectQuotations } = useProcurementPermissions();

const filters = ref({
  'supplier.supplier_name': { value: null, matchMode: FilterMatchMode.CONTAINS },
  status: { value: null, matchMode: FilterMatchMode.EQUALS },
});

const statuses = ['draft', 'submitted', 'under_evaluation', 'accepted', 'rejected'];

const formatStatus = (status: string) => {
  return status.toUpperCase().replace(/_/g, ' ');
};

const getStatusSeverity = (status: string) => {
  const map: Record<string, any> = {
    draft: 'secondary',
    submitted: 'info',
    under_evaluation: 'warning',
    accepted: 'success',
    rejected: 'danger',
  };
  return map[status] || 'info';
};

const getScoreSeverity = (score: number) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'danger';
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

const isExpired = (date: string) => {
  return new Date(date) < new Date();
};

const isExpiringSoon = (date: string) => {
  const expiry = new Date(date);
  const today = new Date();
  const diff = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff > 0 && diff <= 7;
};

const onRowClick = (event: any) => {
  emit('view', event.data);
};
</script>

<style scoped>
.quotation-table :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

.quotation-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: rgba(59, 130, 246, 0.05);
}
</style>
