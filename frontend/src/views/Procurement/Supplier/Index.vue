<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSupplier } from '@/composables/procurement/useSupplier';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';
import SupplierTable from '@/components/Procurement/Tables/SupplierTable.vue';

const router = useRouter();
const { suppliers, loading, fetchSuppliers, deleteSupplier } = useSupplier();
const { canCreate, canDelete } = useProcurementPermissions();

const searchQuery = ref('');
const selectedType = ref('');
const selectedStatus = ref('');

const supplierTypes = ['Manufacturer', 'Wholesaler', 'Retailer', 'Distributor', 'Service Provider'];
const statuses = ['Active', 'Inactive', 'Blacklisted'];

onMounted(() => {
  loadSuppliers();
});

const loadSuppliers = async () => {
  await fetchSuppliers({
    search: searchQuery.value || undefined,
    supplier_type: selectedType.value || undefined,
    status: selectedStatus.value || undefined
  });
};

const handleSearch = () => {
  loadSuppliers();
};

const handleReset = () => {
  searchQuery.value = '';
  selectedType.value = '';
  selectedStatus.value = '';
  loadSuppliers();
};

const handleCreate = () => {
  router.push('/procurement/suppliers/create');
};

const handleRowClick = (supplier: any) => {
  router.push(`/procurement/suppliers/${supplier.id}`);
};

const handleEdit = (supplier: any) => {
  router.push(`/procurement/suppliers/${supplier.id}/edit`);
};

const handleDelete = async (supplier: any) => {
  if (confirm(`Are you sure you want to delete supplier "${supplier.name}"?`)) {
    await deleteSupplier(supplier.id);
    loadSuppliers();
  }
};
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Suppliers</h1>
        <p class="text-gray-600 mt-1">Manage supplier information and performance</p>
      </div>
      <Button
        v-if="canCreate"
        label="Add Supplier"
        icon="pi pi-plus"
        @click="handleCreate"
      />
    </div>

    <!-- Filters -->
    <Card>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="md:col-span-2">
            <IconField iconPosition="left">
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText
                v-model="searchQuery"
                placeholder="Search by name, email, or contact person..."
                class="w-full"
                @keyup.enter="handleSearch"
              />
            </IconField>
          </div>

          <Dropdown
            v-model="selectedType"
            :options="supplierTypes"
            placeholder="All Types"
            showClear
            class="w-full"
          />

          <Dropdown
            v-model="selectedStatus"
            :options="statuses"
            placeholder="All Statuses"
            showClear
            class="w-full"
          />
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <Button
            label="Reset"
            severity="secondary"
            outlined
            @click="handleReset"
          />
          <Button
            label="Search"
            icon="pi pi-search"
            @click="handleSearch"
          />
        </div>
      </template>
    </Card>

    <!-- Table -->
    <Card>
      <template #content>
        <SupplierTable
          :suppliers="suppliers"
          :loading="loading"
          @row-click="handleRowClick"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </template>
    </Card>
  </div>
</template>
