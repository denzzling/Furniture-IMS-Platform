<template>
  <div class="branch-inventory-edit p-4">
    <!-- Breadcrumb -->
    <Breadcrumb :home="{ label: 'Dashboard', to: '/inventory' }" :model="breadcrumbItems" class="mb-4" />

    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Edit Inventory</h1>
      <p class="text-gray-600 mt-1">Update inventory record details</p>
    </div>

    <!-- Loading State -->
    <Card v-if="loading">
      <template #content>
        <div class="space-y-4">
          <Skeleton height="40px" />
          <Skeleton height="40px" />
          <Skeleton height="40px" />
          <Skeleton height="100px" />
        </div>
      </template>
    </Card>

    <!-- Inventory Form -->
    <Card v-else-if="inventory">
      <template #content>
        <InventoryForm
          mode="edit"
          :model-value="inventory"
          @save="handleSave"
          @cancel="handleCancel"
        />
      </template>
    </Card>

    <!-- Error State -->
    <Card v-else>
      <template #content>
        <div class="text-center py-8">
          <i class="pi pi-exclamation-triangle text-5xl text-red-500 mb-3"></i>
          <p class="text-lg text-gray-700 mb-2">Inventory record not found</p>
          <Button
            label="Go Back"
            icon="pi pi-arrow-left"
            @click="handleCancel"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Breadcrumb from 'primevue/breadcrumb';
import Card from 'primevue/card';
import Skeleton from 'primevue/skeleton';
import Button from 'primevue/button';

import InventoryForm from '../../../../components/Inventory/Forms/InventoryForm.vue';
import type { BranchInventory } from '../../../../types/inventory';
import inventoryApi from '../../../../services/api/inventory';

const route = useRoute();
const router = useRouter();
const toast = useToast();

// Refs
const loading = ref(true);
const inventory = ref<BranchInventory | null>(null);

// Breadcrumb
const breadcrumbItems = [
  { label: 'Branch Inventory', to: '/inventory/branch' },
  { label: 'Edit' },
];

/**
 * Load inventory
 */
const loadInventory = async (): Promise<void> => {
  loading.value = true;
  try {
    const id = Number(route.params.id);
    const response = await inventoryApi.getInventoryById(id);
    inventory.value = response.data;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to load inventory record',
      life: 5000,
    });
    inventory.value = null;
  } finally {
    loading.value = false;
  }
};

/**
 * Handle save
 */
const handleSave = async (data: BranchInventory): Promise<void> => {
  try {
    const id = Number(route.params.id);
    await inventoryApi.updateInventory(id, data);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Inventory record updated successfully',
      life: 3000,
    });

    router.push({ name: 'inventory.branch.index' });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to update inventory record',
      life: 5000,
    });
  }
};

/**
 * Handle cancel
 */
const handleCancel = (): void => {
  router.push({ name: 'inventory.branch.index' });
};

// Lifecycle
onMounted(() => {
  loadInventory();
});
</script>
