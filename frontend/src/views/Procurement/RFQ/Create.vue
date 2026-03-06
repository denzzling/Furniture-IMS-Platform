<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useRFQ } from '@/composables/procurement/useRFQ';
import { usePurchaseRequisition } from '@/composables/procurement/usePurchaseRequisition';
import { useSupplier } from '@/composables/procurement/useSupplier';
import { RequestForQuotation } from '@/types/procurement';
import RFQForm from '@/components/Procurement/Forms/RFQForm.vue';

const router = useRouter();
const toast = useToast();
const { createRFQ } = useRFQ();
const { purchaseRequisitions, fetchPurchaseRequisitions } = usePurchaseRequisition();
const { suppliers, fetchSuppliers } = useSupplier();

onMounted(async () => {
  await Promise.all([
    fetchPurchaseRequisitions(),
    fetchSuppliers()
  ]);
});

const handleSubmit = async (formData: RequestForQuotation) => {
  try {
    const createdRFQ = await createRFQ(formData);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'RFQ created successfully',
      life: 3000
    });
    router.push({ name: 'RFQDetail', params: { id: createdRFQ.id } });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create RFQ',
      life: 3000
    });
  }
};

const handleCancel = () => {
  router.push({ name: 'RFQIndex' });
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
        <h1 class="text-3xl font-bold">Create Request for Quotation</h1>
      </div>
      <p class="text-gray-600">Send RFQ to multiple suppliers for competitive pricing</p>
    </div>

    <!-- Info Banner -->
    <div class="mb-6 p-4 bg-purple-50 border border-purple-200 rounded">
      <div class="flex items-start gap-3">
        <i class="pi pi-info-circle text-purple-600 mt-1"></i>
        <div class="text-sm text-purple-900">
          <p class="font-medium mb-1">RFQ Guidelines</p>
          <ul class="list-disc list-inside space-y-1 text-purple-700">
            <li>Select at least <strong>3 suppliers</strong> to ensure competitive pricing</li>
            <li>Set a reasonable deadline (typically 7-14 days) for supplier responses</li>
            <li>Provide detailed specifications for accurate quotations</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Form -->
    <RFQForm
      :purchase-requisitions="purchaseRequisitions"
      :suppliers="suppliers"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
