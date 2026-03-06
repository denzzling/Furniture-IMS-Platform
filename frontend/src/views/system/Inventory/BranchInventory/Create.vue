<template>
  <div class="branch-inventory-create p-4">
    <!-- Breadcrumb -->
    <Breadcrumb :home="{ label: 'Dashboard', to: '/inventory' }" :model="breadcrumbItems" class="mb-4" />

    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Add New Inventory</h1>
      <p class="text-gray-600 mt-1">Create a new inventory record for a branch</p>
    </div>

    <!-- Inventory Form -->
    <Card>
      <template #content>
        <InventoryForm
          mode="create"
          @save="handleSave"
          @cancel="handleCancel"
        />
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Breadcrumb from 'primevue/breadcrumb';
import Card from 'primevue/card';

import InventoryForm from '../../../../components/Inventory/Forms/InventoryForm.vue';
import type { BranchInventory } from '../../../../types/inventory';
import inventoryApi from '../../../../services/api/inventory';

const router = useRouter();
const toast = useToast();

// Breadcrumb
const breadcrumbItems = [
  { label: 'Branch Inventory', to: '/inventory/branch' },
  { label: 'Add New' },
];

/**
 * Handle save
 */
const handleSave = async (data: BranchInventory): Promise<void> => {
  try {
    await inventoryApi.createInventory(data);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Inventory record created successfully',
      life: 3000,
    });

    router.push({ name: 'inventory.branch.index' });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to create inventory record',
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
</script>
