<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useRFQ } from '@/composables/procurement/useRFQ';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';
import RFQTable from '@/components/Procurement/Tables/RFQTable.vue';

const router = useRouter();
const toast = useToast();
const permissions = useProcurementPermissions();
const { rfqs, fetchRFQs, deleteRFQ, loading } = useRFQ();

const filters = ref({
  search: '',
  status: '',
  date_from: '',
  date_to: ''
});

const statusOptions = [
  { label: 'All Status', value: '' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Open', value: 'Open' },
  { label: 'Closed', value: 'Closed' },
  { label: 'Awarded', value: 'Awarded' },
  { label: 'Cancelled', value: 'Cancelled' }
];

onMounted(() => {
  fetchRFQs();
});

const handleSearch = () => {
  fetchRFQs();
};

const handleReset = () => {
  filters.value = {
    search: '',
    status: '',
    date_from: '',
    date_to: ''
  };
  fetchRFQs();
};

const handleRowClick = (rfq: any) => {
  router.push({ name: 'RFQDetail', params: { id: rfq.id } });
};

const handleEdit = (rfq: any) => {
  router.push({ name: 'RFQEdit', params: { id: rfq.id } });
};

const handleDelete = async (rfq: any) => {
  if (confirm(`Are you sure you want to delete RFQ ${rfq.rfq_number}?`)) {
    try {
      await deleteRFQ(rfq.id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'RFQ deleted successfully',
        life: 3000
      });
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete RFQ',
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
        <h1 class="text-3xl font-bold mb-2">Request for Quotations</h1>
        <p class="text-gray-600">Manage RFQs and supplier quotations</p>
      </div>
      <Button
        v-if="permissions.canCreate"
        label="Create RFQ"
        icon="pi pi-plus"
        @click="router.push({ name: 'RFQCreate' })"
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
              placeholder="RFQ number, title..."
              @keyup.enter="handleSearch"
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
          <div class="flex flex-col gap-2 md:col-span-2 lg:col-span-4">
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
    <RFQTable
      :rfqs="rfqs"
      @row-click="handleRowClick"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>
