<template>
  <div class="rfq-table">
    <DataTable
      v-model:filters="filters"
      :value="rfqs"
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
          <p class="text-gray-500">No RFQs found.</p>
          <Button 
            v-if="canCreateRFQs"
            label="Create First RFQ" 
            icon="pi pi-plus" 
            @click="$emit('create')"
            class="mt-3"
          />
        </div>
      </template>

      <Column field="rfq_number" header="RFQ Number" :sortable="true" style="min-width: 150px">
        <template #body="{ data }">
          <span class="font-semibold text-blue-600">{{ data.rfq_number }}</span>
        </template>
      </Column>

      <Column field="title" header="Title" :sortable="true" style="min-width: 250px">
        <template #body="{ data }">
          <div>
            <div class="font-semibold">{{ data.title }}</div>
            <div class="text-xs text-gray-500 truncate">{{ data.description }}</div>
          </div>
        </template>
      </Column>

      <Column field="issue_date" header="Issue Date" :sortable="true" style="min-width: 130px">
        <template #body="{ data }">
          <span class="text-sm">{{ formatDate(data.issue_date) }}</span>
        </template>
      </Column>

      <Column field="deadline_date" header="Deadline" :sortable="true" style="min-width: 180px">
        <template #body="{ data }">
          <div>
            <div class="text-sm">{{ formatDate(data.deadline_date) }}</div>
            <div class="text-xs mt-1" :class="getDeadlineClass(data.deadline_date)">
              {{ getDeadlineCountdown(data.deadline_date) }}
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

      <Column header="Suppliers" style="min-width: 130px">
        <template #body="{ data }">
          <Badge :value="data.suppliers?.length || 0" severity="info" />
        </template>
      </Column>

      <Column header="Quotes" style="min-width: 130px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <Badge :value="data.quotations?.length || 0" severity="success" />
            <ProgressBar 
              v-if="data.suppliers?.length"
              :value="((data.quotations?.length || 0) / (data.suppliers?.length || 1)) * 100" 
              :showValue="false"
              style="height: 8px; width: 60px"
            />
          </div>
        </template>
      </Column>

      <Column field="created_by_user.name" header="Created By" style="min-width: 150px">
        <template #body="{ data }">
          <span class="text-sm">{{ data.created_by_user?.name || 'N/A' }}</span>
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
              v-if="canSendRFQs && data.status === 'draft'"
              icon="pi pi-send"
              severity="success"
              size="small"
              @click.stop="$emit('send', data)"
              v-tooltip.top="'Send to Suppliers'"
            />
            <Button
              v-if="data.status !== 'cancelled'"
              icon="pi pi-clone"
              severity="warning"
              size="small"
              @click.stop="$emit('compare', data)"
              v-tooltip.top="'Compare Quotes'"
            />
            <Button
              v-if="canAwardRFQs && ['quotes_received', 'under_evaluation'].includes(data.status)"
              icon="pi pi-trophy"
              severity="success"
              size="small"
              @click.stop="$emit('award', data)"
              v-tooltip.top="'Award RFQ'"
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
import Badge from 'primevue/badge';
import ProgressBar from 'primevue/progressbar';
import Dropdown from 'primevue/dropdown';
import type { RequestForQuotation } from '@/types/procurement';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';

interface Props {
  rfqs: RequestForQuotation[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'view', rfq: RequestForQuotation): void;
  (e: 'send', rfq: RequestForQuotation): void;
  (e: 'compare', rfq: RequestForQuotation): void;
  (e: 'award', rfq: RequestForQuotation): void;
  (e: 'create'): void;
}>();

const { canCreateRFQs, canSendRFQs, canAwardRFQs } = useProcurementPermissions();

const filters = ref({
  status: { value: null, matchMode: FilterMatchMode.EQUALS },
});

const statuses = ['draft', 'sent', 'quotes_received', 'under_evaluation', 'awarded', 'cancelled'];

const formatStatus = (status: string) => {
  return status.toUpperCase().replace(/_/g, ' ');
};

const getStatusSeverity = (status: string) => {
  const map: Record<string, any> = {
    draft: 'secondary',
    sent: 'info',
    quotes_received: 'warning',
    under_evaluation: 'warning',
    awarded: 'success',
    cancelled: 'danger',
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

const getDeadlineCountdown = (deadline: string) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days < 0) return 'Expired';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day left';
  if (days <= 7) return `${days} days left`;
  return `${Math.floor(days / 7)} weeks left`;
};

const getDeadlineClass = (deadline: string) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days < 0) return 'text-red-600 font-semibold';
  if (days <= 1) return 'text-red-500';
  if (days <= 7) return 'text-orange-500';
  return 'text-green-600';
};

const onRowClick = (event: any) => {
  emit('view', event.data);
};
</script>

<style scoped>
.rfq-table :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

.rfq-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: rgba(59, 130, 246, 0.05);
}
</style>
