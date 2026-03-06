<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { usePurchaseRequisition } from '@/composables/procurement/usePurchaseRequisition';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';
import PurchaseRequisitionTable from '@/components/Procurement/Tables/PurchaseRequisitionTable.vue';

const router = useRouter();
const toast = useToast();
const permissions = useProcurementPermissions();
const { purchaseRequisitions, fetchPurchaseRequisitions, deletePurchaseRequisition, loading } = usePurchaseRequisition();

const filters = ref({
  search: '',
  branch_id: null as number | null,
  status: '',
  procurement_route: '',
  date_from: '',
  date_to: ''
});

const branches = ref<any[]>([
  { id: 1, name: 'Main Branch' },
  { id: 2, name: 'Branch A' },
  { id: 3, name: 'Branch B' }
]);

const statusOptions = [
  { label: 'All Status', value: '' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
  { label: 'Converted', value: 'Converted' }
];

const routeOptions = [
  { label: 'All Routes', value: '' },
  { label: 'Branch Direct', value: 'Branch Direct' },
  { label: 'Centralized', value: 'Centralized' },
  { label: 'RFQ Required', value: 'RFQ Required' }
];

onMounted(() => {
  fetchPurchaseRequisitions();
});

const handleSearch = () => {
  fetchPurchaseRequisitions();
};

const handleReset = () => {
  filters.value = {
    search: '',
    branch_id: null,
    status: '',
    procurement_route: '',
    date_from: '',
    date_to: ''
  };
  fetchPurchaseRequisitions();
};

const handleRowClick = (pr: any) => {
  router.push({ name: 'PurchaseRequisitionDetail', params: { id: pr.id } });
};

const handleEdit = (pr: any) => {
  router.push({ name: 'PurchaseRequisitionEdit', params: { id: pr.id } });
};

const handleDelete = async (pr: any) => {
  if (confirm(`Are you sure you want to delete PR-${pr.pr_number}?`)) {
    try {
      await deletePurchaseRequisition(pr.id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Purchase requisition deleted successfully',
        life: 3000
      });
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete purchase requisition',
        life: 3000
      });
    }
  }
};
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold mb-2">Purchase Requisitions</h1>
        <p class="text-gray-600">Manage and track purchase requisition requests</p>
      </div>
      <Button
        v-if="permissions.canCreate"
        label="Create Purchase Requisition"
        icon="pi pi-plus"
        @click="router.push({ name: 'PurchaseRequisitionCreate' })"
      />
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Search</label>
            <InputText
              v-model="filters.search"
              placeholder="PR number, department..."
              @keyup.enter="handleSearch"
            />
          </div>

          <!-- Branch -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Branch</label>
            <Dropdown
              v-model="filters.branch_id"
              :options="branches"
              optionLabel="name"
              optionValue="id"
              placeholder="All Branches"
              showClear
            />
          </div>

          <!-- Status -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Status</label>
            <Dropdown
              v-model="filters.status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Status"
            />
          </div>

          <!-- Procurement Route -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Procurement Route</label>
            <Dropdown
              v-model="filters.procurement_route"
              :options="routeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Routes"
            />
          </div>

          <!-- Date From -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Date From</label>
            <Calendar
              v-model="filters.date_from"
              dateFormat="yy-mm-dd"
              placeholder="Start date"
              showIcon
            />
          </div>

          <!-- Date To -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Date To</label>
            <Calendar
              v-model="filters.date_to"
              dateFormat="yy-mm-dd"
              placeholder="End date"
              showIcon
            />
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-2 md:col-span-2">
            <label class="text-sm font-medium opacity-0">Actions</label>
            <div class="flex gap-2">
              <Button
                label="Search"
                icon="pi pi-search"
                @click="handleSearch"
                :loading="loading"
                class="flex-1"
              />
              <Button
                label="Reset"
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                @click="handleReset"
                class="flex-1"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Table -->
    <PurchaseRequisitionTable
      :purchase-requisitions="purchaseRequisitions"
      @row-click="handleRowClick"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>
