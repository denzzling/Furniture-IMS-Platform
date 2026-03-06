<template>
  <div class="pr-table">
    <DataTable
      v-model:filters="filters"
      :value="requisitions"
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
          <p class="text-gray-500">No purchase requisitions found.</p>
          <Button 
            v-if="canCreateRequisitions"
            label="Create First PR" 
            icon="pi pi-plus" 
            @click="$emit('create')"
            class="mt-3"
          />
        </div>
      </template>

      <Column field="pr_number" header="PR Number" :sortable="true" style="min-width: 150px">
        <template #body="{ data }">
          <span class="font-semibold text-blue-600">{{ data.pr_number }}</span>
        </template>
      </Column>

      <Column field="branch.name" header="Branch" :sortable="true" style="min-width: 150px">
        <template #body="{ data }">
          <span>{{ data.branch?.name || 'N/A' }}</span>
        </template>
      </Column>

      <Column field="requisition_type" header="Type" :sortable="true" style="min-width: 130px">
        <template #body="{ data }">
          <Tag :value="formatRequisitionType(data.requisition_type)" :severity="getTypeSeverity(data.requisition_type)" />
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Dropdown
            v-model="filterModel.value"
            :options="requisitionTypes"
            placeholder="All Types"
            @change="filterCallback()"
            showClear
          />
        </template>
      </Column>

      <Column field="status" header="Status" :sortable="true" style="min-width: 160px">
        <template #body="{ data }">
          <div class="flex flex-col gap-1">
            <Tag :value="formatStatus(data.status)" :severity="getStatusSeverity(data.status)" />
            <div v-if="data.approval_chain?.length" class="text-xs text-gray-500">
              {{ data.approval_chain.filter((a: any) => a.approved_at).length }}/{{ data.approval_chain.length }} approvals
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

      <Column field="estimated_amount" header="Estimated Amount" :sortable="true" style="min-width: 160px">
        <template #body="{ data }">
          <span class="font-semibold text-green-600">{{ formatCurrency(data.estimated_amount) }}</span>
        </template>
      </Column>

      <Column field="required_date" header="Required Date" :sortable="true" style="min-width: 130px">
        <template #body="{ data }">
          <div>
            <div>{{ formatDate(data.required_date) }}</div>
            <div v-if="isOverdue(data.required_date)" class="text-xs text-red-500">Overdue</div>
          </div>
        </template>
      </Column>

      <Column field="procurement_route" header="Route" style="min-width: 140px">
        <template #body="{ data }">
          <Tag :value="formatProcurementRoute(data.procurement_route)" :severity="getRouteSeverity(data.procurement_route)" />
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Dropdown
            v-model="filterModel.value"
            :options="procurementRoutes"
            placeholder="All Routes"
            @change="filterCallback()"
            showClear
          />
        </template>
      </Column>

      <Column field="priority" header="Priority" :sortable="true" style="min-width: 120px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <Tag :value="String(data.priority)" :severity="getPrioritySeverity(data.priority)" />
            <div v-for="n in data.priority" :key="n" class="w-2 h-2 rounded-full" :class="getPriorityColor(data.priority)"></div>
          </div>
        </template>
      </Column>

      <Column field="requested_by_user.name" header="Requested By" style="min-width: 150px">
        <template #body="{ data }">
          <span class="text-sm">{{ data.requested_by_user?.name || 'N/A' }}</span>
        </template>
      </Column>

      <Column field="created_at" header="Created" :sortable="true" style="min-width: 130px">
        <template #body="{ data }">
          <span class="text-sm">{{ formatDate(data.created_at) }}</span>
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
              v-if="canApproveRequisitions && ['submitted', 'warehouse_approved'].includes(data.status)"
              icon="pi pi-check"
              severity="success"
              size="small"
              @click.stop="$emit('approve', data)"
              v-tooltip.top="'Approve'"
            />
            <Button
              v-if="canRejectRequisitions && ['submitted'].includes(data.status)"
              icon="pi pi-times"
              severity="danger"
              size="small"
              @click.stop="$emit('reject', data)"
              v-tooltip.top="'Reject'"
            />
            <Button
              v-if="data.status === 'approved'"
              icon="pi pi-shopping-cart"
              severity="warning"
              size="small"
              @click.stop="$emit('convert-to-po', data)"
              v-tooltip.top="'Convert to PO'"
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
import type { PurchaseRequisition } from '@/types/procurement';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';

interface Props {
  requisitions: PurchaseRequisition[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'view', requisition: PurchaseRequisition): void;
  (e: 'approve', requisition: PurchaseRequisition): void;
  (e: 'reject', requisition: PurchaseRequisition): void;
  (e: 'convert-to-po', requisition: PurchaseRequisition): void;
  (e: 'create'): void;
}>();

const { canCreateRequisitions, canApproveRequisitions, canRejectRequisitions } = useProcurementPermissions();

const filters = ref({
  requisition_type: { value: null, matchMode: FilterMatchMode.EQUALS },
  status: { value: null, matchMode: FilterMatchMode.EQUALS },
  procurement_route: { value: null, matchMode: FilterMatchMode.EQUALS },
});

const requisitionTypes = ['regular', 'urgent', 'new_product', 'seasonal', 'emergency'];
const statuses = ['draft', 'submitted', 'warehouse_approved', 'finance_approved', 'approved', 'rejected', 'cancelled', 'converted_to_po'];
const procurementRoutes = ['branch_direct', 'centralized', 'rfq_required'];

const formatRequisitionType = (type: string) => {
  const map: Record<string, string> = {
    regular: 'Regular',
    urgent: 'Urgent',
    new_product: 'New Product',
    seasonal: 'Seasonal',
    emergency: 'Emergency',
  };
  return map[type] || type;
};

const formatStatus = (status: string) => {
  return status.toUpperCase().replace(/_/g, ' ');
};

const formatProcurementRoute = (route: string) => {
  const map: Record<string, string> = {
    branch_direct: 'Branch Direct',
    centralized: 'Centralized',
    rfq_required: 'RFQ Required',
  };
  return map[route] || route;
};

const getTypeSeverity = (type: string) => {
  const map: Record<string, any> = {
    regular: 'info',
    urgent: 'warning',
    new_product: 'success',
    seasonal: 'info',
    emergency: 'danger',
  };
  return map[type] || 'info';
};

const getStatusSeverity = (status: string) => {
  const map: Record<string, any> = {
    draft: 'secondary',
    submitted: 'warning',
    warehouse_approved: 'info',
    finance_approved: 'info',
    approved: 'success',
    rejected: 'danger',
    cancelled: 'danger',
    converted_to_po: 'success',
  };
  return map[status] || 'info';
};

const getRouteSeverity = (route: string) => {
  const map: Record<string, any> = {
    branch_direct: 'info',
    centralized: 'secondary',
    rfq_required: 'warning',
  };
  return map[route] || 'info';
};

const getPrioritySeverity = (priority: number) => {
  if (priority >= 4) return 'danger';
  if (priority >= 3) return 'warning';
  return 'info';
};

const getPriorityColor = (priority: number) => {
  if (priority >= 4) return 'bg-red-500';
  if (priority >= 3) return 'bg-orange-500';
  return 'bg-blue-500';
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

const isOverdue = (date: string) => {
  return new Date(date) < new Date();
};

const onRowClick = (event: any) => {
  emit('view', event.data);
};
</script>

<style scoped>
.pr-table :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

.pr-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: rgba(59, 130, 246, 0.05);
}
</style>
