<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useGoodsReceipt } from '@/composables/procurement/useGoodsReceipt';
import { usePurchaseOrder } from '@/composables/procurement/usePurchaseOrder';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';
import GoodsReceiptTable from '@/components/Procurement/Tables/GoodsReceiptTable.vue';

const router = useRouter();
const toast = useToast();
const permissions = useProcurementPermissions();
const { goodsReceipts, fetchGoodsReceipts, deleteGoodsReceipt, loading } = useGoodsReceipt();
const { purchaseOrders, fetchPurchaseOrders } = usePurchaseOrder();

const filters = ref({
  search: '',
  po_id: null as number | null,
  status: '',
  date_from: '',
  date_to: ''
});

const statusOptions = [
  { label: 'All Status', value: '' },
  { label: 'Received', value: 'Received' },
  { label: 'Partial', value: 'Partial' },
  { label: 'Verified', value: 'Verified' },
  { label: 'Discrepancy', value: 'Discrepancy' }
];

const showPOSelectionDialog = ref(false);
const selectedPO = ref<any>(null);

onMounted(async () => {
  await Promise.all([
    fetchGoodsReceipts(),
    fetchPurchaseOrders()
  ]);
});

const handleSearch = () => {
  fetchGoodsReceipts();
};

const handleReset = () => {
  filters.value = {
    search: '',
    po_id: null,
    status: '',
    date_from: '',
    date_to: ''
  };
  fetchGoodsReceipts();
};

const handleRowClick = (gr: any) => {
  router.push({ name: 'GoodsReceiptDetail', params: { id: gr.id } });
};

const handleEdit = (gr: any) => {
  router.push({ name: 'GoodsReceiptEdit', params: { id: gr.id } });
};

const handleDelete = async (gr: any) => {
  if (confirm(`Are you sure you want to delete Goods Receipt ${gr.receipt_number}?`)) {
    try {
      await deleteGoodsReceipt(gr.id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Goods receipt deleted successfully',
        life: 3000
      });
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete goods receipt',
        life: 3000
      });
    }
  }
};

const handleCreateReceipt = () => {
  showPOSelectionDialog.value = true;
};

const handlePOSelected = () => {
  if (selectedPO.value) {
    router.push({ 
      name: 'GoodsReceiptCreate', 
      query: { po_id: selectedPO.value.id } 
    });
    showPOSelectionDialog.value = false;
    selectedPO.value = null;
  }
};

const approvedPOs = ref<any[]>([]);

const filterApprovedPOs = () => {
  approvedPOs.value = purchaseOrders.value.filter(po => 
    po.status === 'Approved' || po.status === 'Sent'
  );
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(value);
};
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold mb-2">Goods Receipts</h1>
        <p class="text-gray-600">Track and manage goods received from suppliers</p>
      </div>
      <Button
        v-if="permissions.canCreate"
        label="Record Goods Receipt"
        icon="pi pi-plus"
        @click="handleCreateReceipt(); filterApprovedPOs()"
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
              placeholder="Receipt number..."
              @keyup.enter="handleSearch"
            />
          </div>

          <!-- Purchase Order -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Purchase Order</label>
            <Dropdown
              v-model="filters.po_id"
              :options="purchaseOrders"
              optionLabel="po_number"
              optionValue="id"
              placeholder="All POs"
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
            <label class="text-sm font-medium">Receipt Date From</label>
            <Calendar
              v-model="filters.date_from"
              dateFormat="yy-mm-dd"
              placeholder="Start date"
              showIcon
            />
          </div>

          <!-- Date To -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Receipt Date To</label>
            <Calendar
              v-model="filters.date_to"
              dateFormat="yy-mm-dd"
              placeholder="End date"
              showIcon
            />
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-2 md:col-span-2 lg:col-span-3">
            <label class="text-sm font-medium opacity-0">Actions</label>
            <div class="flex gap-2">
              <Button
                label="Search"
                icon="pi pi-search"
                @click="handleSearch"
                :loading="loading"
              />
              <Button
                label="Reset"
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                @click="handleReset"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Table -->
    <GoodsReceiptTable
      :goods-receipts="goodsReceipts"
      @row-click="handleRowClick"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <!-- PO Selection Dialog -->
    <Dialog
      v-model:visible="showPOSelectionDialog"
      modal
      :style="{ width: '700px' }"
      header="Select Purchase Order"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          Select an approved purchase order to record goods receipt
        </p>

        <DataTable
          v-model:selection="selectedPO"
          :value="approvedPOs"
          selectionMode="single"
          dataKey="id"
          responsiveLayout="scroll"
          :paginator="approvedPOs.length > 5"
          :rows="5"
        >
          <Column selectionMode="single" headerStyle="width: 3rem" />
          <Column field="po_number" header="PO Number" />
          <Column field="supplier.name" header="Supplier" />
          <Column header="Order Date">
            <template #body="{ data }">
              {{ new Date(data.order_date).toLocaleDateString('en-PH') }}
            </template>
          </Column>
          <Column header="Total Amount">
            <template #body="{ data }">
              {{ formatCurrency(data.total_amount) }}
            </template>
          </Column>
          <Column field="status" header="Status">
            <template #body="{ data }">
              <Tag :value="data.status" />
            </template>
          </Column>
          <template #empty>
            <div class="text-center py-8 text-gray-500">
              <i class="pi pi-inbox text-4xl mb-2"></i>
              <p>No approved purchase orders available</p>
            </div>
          </template>
        </DataTable>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            severity="secondary"
            outlined
            @click="showPOSelectionDialog = false; selectedPO = null"
          />
          <Button
            label="Continue"
            icon="pi pi-arrow-right"
            @click="handlePOSelected"
            :disabled="!selectedPO"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>
