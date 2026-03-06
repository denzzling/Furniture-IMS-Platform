<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { usePurchaseOrder } from '@/composables/procurement/usePurchaseOrder';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';
import PurchaseOrderTable from '@/components/Procurement/Tables/PurchaseOrderTable.vue';

const router = useRouter();
const toast = useToast();
const permissions = useProcurementPermissions();
const { purchaseOrders, fetchPurchaseOrders, deletePurchaseOrder, loading } = usePurchaseOrder();

const filters = ref({
  search: '',
  supplier_id: null as number | null,
  branch_id: null as number | null,
  status: '',
  date_from: '',
  date_to: ''
});

const suppliers = ref<any[]>([]);
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
  { label: 'Sent', value: 'Sent' },
  { label: 'Completed', value: 'Completed' }
];

onMounted(() => {
  fetchPurchaseOrders();
});

const handleSearch = () => {
  fetchPurchaseOrders();
};

const handleReset = () => {
  filters.value = {
    search: '',
    supplier_id: null,
    branch_id: null,
    status: '',
    date_from: '',
    date_to: ''
  };
  fetchPurchaseOrders();
};

const handleRowClick = (po: any) => {
  router.push({ name: 'PurchaseOrderDetail', params: { id: po.id } });
};

const handleEdit = (po: any) => {
  router.push({ name: 'PurchaseOrderEdit', params: { id: po.id } });
};

const handleDelete = async (po: any) => {
  if (confirm(`Are you sure you want to delete PO ${po.po_number}?`)) {
    try {
      await deletePurchaseOrder(po.id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Purchase order deleted successfully',
        life: 3000
      });
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete purchase order',
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
        <h1 class="text-3xl font-bold mb-2">Purchase Orders</h1>
        <p class="text-gray-600">Manage and track purchase orders</p>
      </div>
      <Button
        v-if="permissions.canCreate"
        label="Create Purchase Order"
        icon="pi pi-plus"
        @click="router.push({ name: 'PurchaseOrderCreate' })"
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
              placeholder="PO number, supplier..."
              @keyup.enter="handleSearch"
            />
          </div>

          <!-- Supplier -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Supplier</label>
            <Dropdown
              v-model="filters.supplier_id"
              :options="suppliers"
              optionLabel="name"
              optionValue="id"
              placeholder="All Suppliers"
              showClear
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

          <!-- Date From -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Order Date From</label>
            <Calendar
              v-model="filters.date_from"
              dateFormat="yy-mm-dd"
              placeholder="Start date"
              showIcon
            />
          </div>

          <!-- Date To -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Order Date To</label>
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
    <PurchaseOrderTable
      :purchase-orders="purchaseOrders"
      @row-click="handleRowClick"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>
