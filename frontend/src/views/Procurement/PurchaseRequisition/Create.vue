<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { usePurchaseRequisition } from '@/composables/procurement/usePurchaseRequisition';
import { PurchaseRequisition } from '@/types/procurement';
import PurchaseRequisitionForm from '@/components/Procurement/Forms/PurchaseRequisitionForm.vue';

const router = useRouter();
const toast = useToast();
const { createPurchaseRequisition } = usePurchaseRequisition();

const handleSubmit = async (formData: PurchaseRequisition, isDraft: boolean = false) => {
  try {
    const createdPR = await createPurchaseRequisition(formData);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: isDraft 
        ? 'Purchase requisition saved as draft' 
        : 'Purchase requisition created and submitted for approval',
      life: 3000
    });

    if (isDraft) {
      // Stay on the page for drafts, maybe just reset or show a message
      toast.add({
        severity: 'info',
        summary: 'Draft Saved',
        detail: 'You can continue editing or submit for approval',
        life: 3000
      });
    } else {
      // Navigate to detail page for submitted PRs
      router.push({ name: 'PurchaseRequisitionDetail', params: { id: createdPR.id } });
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create purchase requisition',
      life: 3000
    });
  }
};

const handleCancel = () => {
  router.push({ name: 'PurchaseRequisitionIndex' });
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
        <h1 class="text-3xl font-bold">Create Purchase Requisition</h1>
      </div>
      <p class="text-gray-600">Submit a new purchase request for approval</p>
    </div>

    <!-- Info Banner -->
    <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
      <div class="flex items-start gap-3">
        <i class="pi pi-info-circle text-blue-600 mt-1"></i>
        <div class="text-sm text-blue-900">
          <p class="font-medium mb-1">Procurement Route Guidelines</p>
          <ul class="list-disc list-inside space-y-1 text-blue-700">
            <li><strong>Branch Direct:</strong> Total amount ≤ ₱100,000</li>
            <li><strong>Centralized:</strong> Total amount between ₱100,001 - ₱500,000</li>
            <li><strong>RFQ Required:</strong> Total amount > ₱500,000</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Form -->
    <PurchaseRequisitionForm
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
