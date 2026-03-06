<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useSupplier } from '@/composables/procurement/useSupplier';
import { Supplier } from '@/types/procurement';
import SupplierForm from '@/components/Procurement/Forms/SupplierForm.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { fetchSupplierById, updateSupplier, loading } = useSupplier();

const supplier = ref<Supplier | null>(null);
const supplierId = Number(route.params.id);

onMounted(async () => {
  if (supplierId) {
    const data = await fetchSupplierById(supplierId);
    if (data) {
      supplier.value = data;
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Supplier not found',
        life: 3000
      });
      router.push({ name: 'SupplierIndex' });
    }
  }
});

const handleUpdate = async (formData: Supplier) => {
  try {
    await updateSupplier(supplierId, formData);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Supplier updated successfully',
      life: 3000
    });
    router.push({ name: 'SupplierDetail', params: { id: supplierId } });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update supplier',
      life: 3000
    });
  }
};

const handleCancel = () => {
  router.push({ name: 'SupplierDetail', params: { id: supplierId } });
};
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <Button
          icon="pi pi-arrow-left"
          text
          rounded
          @click="handleCancel"
        />
        <h1 class="text-3xl font-bold">Edit Supplier</h1>
      </div>
      <p class="text-gray-600">Update supplier information</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !supplier" class="flex items-center justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Form -->
    <div v-else-if="supplier">
      <SupplierForm
        :supplier="supplier"
        @submit="handleUpdate"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>
