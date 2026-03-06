<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { usePurchaseOrder } from '@/composables/procurement/usePurchaseOrder';
import { useSupplier } from '@/composables/procurement/useSupplier';
import { useSupplierQuotation } from '@/composables/procurement/useSupplierQuotation';
import { PurchaseOrder } from '@/types/procurement';
import PurchaseOrderForm from '@/components/Procurement/Forms/PurchaseOrderForm.vue';

const router = useRouter();
const toast = useToast();
const { createPurchaseOrder } = usePurchaseOrder();
const { suppliers, fetchSuppliers } = useSupplier();
const { quotations, fetchQuotations } = useSupplierQuotation();

onMounted(async () => {
  await Promise.all([
    fetchSuppliers(),
    fetchQuotations()
  ]);
});

const handleSubmit = async (formData: PurchaseOrder) => {
  try {
    const createdPO = await createPurchaseOrder(formData);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Purchase order created successfully',
      life: 3000
    });
    router.push({ name: 'PurchaseOrderDetail', params: { id: createdPO.id } });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create purchase order',
      life: 3000
    });
  }
};

const handleCancel = () => {
  router.push({ name: 'PurchaseOrderIndex' });
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
        <h1 class="text-3xl font-bold">Create Purchase Order</h1>
      </div>
      <p class="text-gray-600">Generate a new purchase order from quotation or manually</p>
    </div>

    <!-- Info Banner -->
    <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded">
      <div class="flex items-start gap-3">
        <i class="pi pi-info-circle text-green-600 mt-1"></i>
        <div class="text-sm text-green-900">
          <p class="font-medium mb-1">Purchase Order Approval Levels</p>
          <ul class="list-disc list-inside space-y-1 text-green-700">
            <li><strong>≤ ₱100,000:</strong> Branch Manager approval required</li>
            <li><strong>₱ 100,001 - ₱500,000:</strong> Branch Manager + Procurement Manager approval</li>
            <li><strong>> ₱500,000:</strong> Branch Manager + Procurement Manager + Finance Manager + CEO approval</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Form -->
    <PurchaseOrderForm
      :suppliers="suppliers"
      :quotations="quotations"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
