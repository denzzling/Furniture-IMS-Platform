<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { PurchaseRequisition } from '@/types/procurement';
import { usePurchaseRequisition } from '@/composables/procurement/usePurchaseRequisition';

const props = defineProps<{
  visible: boolean;
  purchaseRequisition: PurchaseRequisition;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  approved: [pr: PurchaseRequisition];
  rejected: [pr: PurchaseRequisition];
}>();

const { approvePR, rejectPR, loading } = usePurchaseRequisition();

const formData = reactive({
  action: '' as 'approve' | 'reject' | '',
  remarks: ''
});

const errors = reactive({
  action: '',
  remarks: ''
});

const handleClose = () => {
  emit('update:visible', false);
  resetForm();
};

const resetForm = () => {
  formData.action = '';
  formData.remarks = '';
  Object.keys(errors).forEach(key => errors[key as keyof typeof errors] = '');
};

const validateForm = (): boolean => {
  let isValid = true;
  Object.keys(errors).forEach(key => errors[key as keyof typeof errors] = '');

  if (!formData.action) {
    errors.action = 'Please select an action';
    isValid = false;
  }

  if (!formData.remarks.trim()) {
    errors.remarks = 'Remarks are required';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    if (formData.action === 'approve') {
      await approvePR(props.purchaseRequisition.id, formData.remarks);
      emit('approved', props.purchaseRequisition);
    } else {
      await rejectPR(props.purchaseRequisition.id, formData.remarks);
      emit('rejected', props.purchaseRequisition);
    }
    handleClose();
  } catch (error) {
    console.error('Approval/Rejection failed:', error);
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(value);
};

watch(() => props.visible, (newVal) => {
  if (!newVal) {
    resetForm();
  }
});
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="handleClose"
    modal
    :style="{ width: '600px' }"
    header="Purchase Requisition Approval"
  >
    <div class="space-y-4">
      <!-- PR Details -->
      <div class="border rounded p-3 bg-gray-50">
        <h4 class="font-semibold mb-2">PR Details</h4>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span class="font-medium">PR Number:</span>
            <span class="ml-1">{{ purchaseRequisition.pr_number }}</span>
          </div>
          <div>
            <span class="font-medium">Branch:</span>
            <span class="ml-1">{{ purchaseRequisition.branch?.name }}</span>
          </div>
          <div>
            <span class="font-medium">Type:</span>
            <span class="ml-1">{{ purchaseRequisition.requisition_type }}</span>
          </div>
          <div>
            <span class="font-medium">Priority:</span>
            <span class="ml-1">{{ purchaseRequisition.priority }}/5</span>
          </div>
          <div class="col-span-2">
            <span class="font-medium">Estimated Total:</span>
            <span class="ml-1 font-semibold text-blue-600">
              {{ formatCurrency(purchaseRequisition.estimated_total) }}
            </span>
          </div>
          <div class="col-span-2">
            <span class="font-medium">Procurement Route:</span>
            <span class="ml-1">{{ purchaseRequisition.procurement_route }}</span>
          </div>
        </div>
      </div>

      <!-- Items -->
      <div class="border rounded p-3">
        <h4 class="font-semibold mb-2">Items ({{ purchaseRequisition.items?.length || 0 }})</h4>
        <div class="max-h-40 overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-100 sticky top-0">
              <tr>
                <th class="text-left p-2">Product</th>
                <th class="text-right p-2">Qty</th>
                <th class="text-right p-2">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in purchaseRequisition.items" :key="item.id" class="border-b">
                <td class="p-2">{{ item.product?.name }}</td>
                <td class="text-right p-2">{{ item.quantity_requested }}</td>
                <td class="text-right p-2">{{ formatCurrency(item.estimated_unit_cost * item.quantity_requested) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Action Selection -->
      <div class="border rounded p-3">
        <label class="font-medium text-sm mb-2 block">
          Action <span class="text-red-500">*</span>
        </label>
        <div class="flex gap-4">
          <div class="flex items-center">
            <RadioButton
              inputId="approve"
              v-model="formData.action"
              value="approve"
            />
            <label for="approve" class="ml-2 cursor-pointer">
              <span class="font-medium text-green-600">Approve</span>
            </label>
          </div>
          <div class="flex items-center">
            <RadioButton
              inputId="reject"
              v-model="formData.action"
              value="reject"
            />
            <label for="reject" class="ml-2 cursor-pointer">
              <span class="font-medium text-red-600">Reject</span>
            </label>
          </div>
        </div>
        <small v-if="errors.action" class="text-red-500 block mt-1">{{ errors.action }}</small>
      </div>

      <!-- Remarks -->
      <div class="flex flex-col gap-2">
        <label for="remarks" class="font-medium text-sm">
          Remarks <span class="text-red-500">*</span>
        </label>
        <Textarea
          id="remarks"
          v-model="formData.remarks"
          rows="3"
          :placeholder="formData.action === 'approve' ? 'Approval notes...' : formData.action === 'reject' ? 'Rejection reason...' : 'Enter your remarks...'"
          :class="{ 'p-invalid': errors.remarks }"
        />
        <small v-if="errors.remarks" class="text-red-500">{{ errors.remarks }}</small>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          @click="handleClose"
          :disabled="loading"
        />
        <Button
          :label="formData.action === 'approve' ? 'Approve PR' : formData.action === 'reject' ? 'Reject PR' : 'Submit'"
          :severity="formData.action === 'approve' ? 'success' : formData.action === 'reject' ? 'danger' : 'primary'"
          @click="handleSubmit"
          :loading="loading"
          :disabled="!formData.action"
        />
      </div>
    </template>
  </Dialog>
</template>
