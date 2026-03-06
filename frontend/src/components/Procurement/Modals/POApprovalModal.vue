<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { PurchaseOrder } from '@/types/procurement';
import { usePurchaseOrder } from '@/composables/procurement/usePurchaseOrder';

const props = defineProps<{
  visible: boolean;
  purchaseOrder: PurchaseOrder;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  approved: [po: PurchaseOrder];
  rejected: [po: PurchaseOrder];
}>();

const { approvePO, rejectPO, loading } = usePurchaseOrder();

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
      await approvePO(props.purchaseOrder.id, formData.remarks);
      emit('approved', props.purchaseOrder);
    } else {
      await rejectPO(props.purchaseOrder.id, formData.remarks);
      emit('rejected', props.purchaseOrder);
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

const getApprovalLevel = (amount: number) => {
  if (amount > 500000) return 'CEO Approval Required';
  if (amount > 100000) return 'Finance Manager Approval Required';
  return 'Branch Manager Approval';
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
    :style="{ width: '700px' }"
    header="Purchase Order Approval"
  >
    <div class="space-y-4">
      <!-- PO Details -->
      <div class="border rounded p-4 bg-gray-50">
        <h4 class="font-semibold mb-3">Purchase Order Details</h4>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="font-medium text-gray-600">PO Number:</span>
            <span class="ml-2">{{ purchaseOrder.po_number }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-600">Supplier:</span>
            <span class="ml-2">{{ purchaseOrder.supplier?.name }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-600">Branch:</span>
            <span class="ml-2">{{ purchaseOrder.branch?.name }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-600">Order Date:</span>
            <span class="ml-2">{{ new Date(purchaseOrder.order_date).toLocaleDateString('en-PH') }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-600">Expected Delivery:</span>
            <span class="ml-2">{{ new Date(purchaseOrder.expected_delivery_date).toLocaleDateString('en-PH') }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-600">Payment Terms:</span>
            <span class="ml-2">{{ purchaseOrder.payment_terms }}</span>
          </div>
        </div>
      </div>

      <!-- Amount Breakdown -->
      <div class="border rounded p-4 bg-blue-50">
        <h4 class="font-semibold mb-3">Amount Breakdown</h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Subtotal:</span>
            <span class="font-semibold">{{ formatCurrency(purchaseOrder.subtotal) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Tax:</span>
            <span class="font-semibold">{{ formatCurrency(purchaseOrder.tax_amount) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Shipping:</span>
            <span class="font-semibold">{{ formatCurrency(purchaseOrder.shipping_cost) }}</span>
          </div>
          <div v-if="purchaseOrder.discount_amount > 0" class="flex justify-between">
            <span class="text-gray-600">Discount:</span>
            <span class="font-semibold text-red-600">-{{ formatCurrency(purchaseOrder.discount_amount) }}</span>
          </div>
          <div class="flex justify-between pt-2 border-t text-lg font-bold">
            <span>Total Amount:</span>
            <span class="text-blue-600">{{ formatCurrency(purchaseOrder.total_amount) }}</span>
          </div>
        </div>
      </div>

      <!-- Approval Level Indicator -->
      <div class="p-3 bg-yellow-50 border border-yellow-200 rounded">
        <div class="flex items-center gap-2">
          <i class="pi pi-info-circle text-yellow-600"></i>
          <div class="text-sm">
            <span class="font-medium">Approval Level: </span>
            <span class="text-yellow-800">{{ getApprovalLevel(purchaseOrder.total_amount) }}</span>
          </div>
        </div>
      </div>

      <!-- Items Summary -->
      <div class="border rounded p-4">
        <h4 class="font-semibold mb-3">Items ({{ purchaseOrder.items?.length || 0 }})</h4>
        <div class="max-h-48 overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-100 sticky top-0">
              <tr>
                <th class="text-left p-2">Product</th>
                <th class="text-right p-2">Qty</th>
                <th class="text-right p-2">Unit Price</th>
                <th class="text-right p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in purchaseOrder.items" :key="item.id" class="border-b">
                <td class="p-2">
                  <div>{{ item.product?.name }}</div>
                  <div v-if="item.product_variation" class="text-xs text-gray-500">
                    {{ item.product_variation.name }}
                  </div>
                </td>
                <td class="text-right p-2">{{ item.quantity }}</td>
                <td class="text-right p-2">{{ formatCurrency(item.unit_price) }}</td>
                <td class="text-right p-2 font-semibold">
                  {{ formatCurrency(item.quantity * item.unit_price) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Action Selection -->
      <div class="border rounded p-4">
        <label class="font-medium text-sm mb-3 block">
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
              <span class="font-medium text-green-600">Approve Purchase Order</span>
            </label>
          </div>
          <div class="flex items-center">
            <RadioButton
              inputId="reject"
              v-model="formData.action"
              value="reject"
            />
            <label for="reject" class="ml-2 cursor-pointer">
              <span class="font-medium text-red-600">Reject Purchase Order</span>
            </label>
          </div>
        </div>
        <small v-if="errors.action" class="text-red-500 block mt-2">{{ errors.action }}</small>
      </div>

      <!-- Remarks -->
      <div class="flex flex-col gap-2">
        <label for="remarks" class="font-medium text-sm">
          Approval/Rejection Remarks <span class="text-red-500">*</span>
        </label>
        <Textarea
          id="remarks"
          v-model="formData.remarks"
          rows="4"
          :placeholder="formData.action === 'approve' ? 'Enter approval notes and any special instructions...' : formData.action === 'reject' ? 'Please provide a detailed reason for rejection...' : 'Enter your remarks...'"
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
          :label="formData.action === 'approve' ? 'Approve PO' : formData.action === 'reject' ? 'Reject PO' : 'Submit'"
          :severity="formData.action === 'approve' ? 'success' : formData.action === 'reject' ? 'danger' : 'primary'"
          :icon="formData.action === 'approve' ? 'pi pi-check' : formData.action === 'reject' ? 'pi pi-times' : 'pi pi-send'"
          @click="handleSubmit"
          :loading="loading"
          :disabled="!formData.action"
        />
      </div>
    </template>
  </Dialog>
</template>
