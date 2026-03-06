<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useSupplier } from '@/composables/procurement/useSupplier';
import SupplierForm from '@/components/Procurement/Forms/SupplierForm.vue';

const router = useRouter();
const toast = useToast();
const { createSupplier, loading } = useSupplier();

const handleSubmit = async (data: any) => {
  try {
    const created = await createSupplier(data);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Supplier created successfully',
      life: 3000
    });
    router.push(`/procurement/suppliers/${created.id}`);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to create supplier',
      life: 5000
    });
  }
};

const handleCancel = () => {
  router.push('/procurement/suppliers');
};
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <Button
        icon="pi pi-arrow-left"
        severity="secondary"
        text
        rounded
        @click="handleCancel"
      />
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Create Supplier</h1>
        <p class="text-gray-600 mt-1">Add a new supplier to the system</p>
      </div>
    </div>

    <!-- Form -->
    <Card>
      <template #content>
        <SupplierForm
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </template>
    </Card>
  </div>
</template>
