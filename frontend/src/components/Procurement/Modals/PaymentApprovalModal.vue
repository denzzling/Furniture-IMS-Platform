<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { SupplierPayment, PurchaseOrder } from '@/types/procurement';
import { useSupplierPayment } from '@/composables/procurement/useSupplierPayment';

const props = defineProps<{
  visible: boolean;
  payment: SupplierPayment;
  purchaseOrder?: PurchaseOrder;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  approved: [payment: SupplierPayment];
  rejected: [payment: SupplierPayment];
}>();

const { approvePayment, rejectPayment, loading } = useSupplierPayment();

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
      await approvePayment(props.payment.id, formData.remarks);
      emit('approved', props.payment);
    } else {
      await rejectPayment(props.payment.id, formData.remarks);
      emit('rejected', props.payment);
    }
    handleClose();
  } catch (error) {
    console.error('Payment approval/rejection failed:', error);
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
    :style="{ width: '650px' }"
    header="Supplier Payment Approval"
  >
    <div class="space-y-4">
      <!-- Payment Details -->
      <div class="border rounded p-4 bg-gray-50">
        <h4 class="font-semibold mb-3">Payment Details</h4>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="font-medium text-gray-600">Reference Number:</span>
            <span class="ml-2">{{ payment.reference_number }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-600">Payment Date:</span>
            <span class="ml-2">{{ new Date(payment.payment_date).toLocaleDateString('en-PH') }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-600">Payment Method:</span>
            <span class="ml-2">{{ payment.payment_method }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-600">Status:</span>
            <Tag :value="payment.status" :severity="payment.status === 'Pending' ? 'warning' : 'info'" class="ml-2" />
          </div>
        </div>
      </div>

      <!-- PO Reference -->
      <div v-if="purchaseOrder" class="border rounded p-4 bg-blue-50">
        <h4 class="font-semibold mb-3">Purchase Order Reference</h4>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="font-medium text-gray-600">PO Number:</span>
            <span class="ml-2">{{ purchaseOrder.po_number }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-600">Supplier:</span>
            <span class="ml-2">{{ purchaseOrder.supplier?.name }}</span>
          </div>
          <div class="col-span-2">
            <span class="font-medium text-gray-600">PO Total:</span>
            <span class="ml-2 font-semibold">{{ formatCurrency(purchaseOrder.total_amount) }}</span>
          </div>
        </div>
      </div>

      <!-- Amount Information -->
      <div class="border rounded p-4 bg-green-50">
        <h4 class="font-semibold mb-3">Payment Amount Breakdown</h4>
        <div class="space-y-2">
          <div v-if="purchaseOrder" class="flex justify-between text-sm">
            <span class="text-gray-600">PO Total Amount:</span>
            <span class="font-semibold">{{ formatCurrency(purchaseOrder.total_amount) }}</span>
          </div>
          <div v-if="purchaseOrder" class="flex justify-between text-sm">
            <span class="text-gray-600">Previously Paid:</span>
            <span class="font-semibold">{{ formatCurrency(purchaseOrder.paid_amount || 0) }}</span>
          </div>
          <div class="flex justify-between text-lg font-bold pt-2 border-t">
            <span>This Payment:</span>
            <span class="text-green-600">{{ formatCurrency(payment.payment_amount) }}</span>
          </div>
          <div v-if="purchaseOrder" class="flex justify-between text-sm">
            <span class="text-gray-600">Remaining Balance:</span>
            <span class="font-semibold text-orange-600">
              {{ formatCurrency(purchaseOrder.total_amount - (purchaseOrder.paid_amount || 0) - payment.payment_amount) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Payment Method Details -->
      <div v-if="payment.payment_method === 'Bank Transfer' || payment.payment_method === 'Check'" class="border rounded p-3">
        <h4 class="font-semibold mb-2 text-sm">{{ payment.payment_method }} Details</h4>
        <div class="space-y-2 text-sm">
          <div v-if="payment.bank_name">
            <span class="font-medium text-gray-600">Bank:</span>
            <span class="ml-2">{{ payment.bank_name }}</span>
          </div>
          <div v-if="payment.account_number">
            <span class="font-medium text-gray-600">Account:</span>
            <span class="ml-2">{{ payment.account_number }}</span>
          </div>
          <div v-if="payment.check_number">
            <span class="font-medium text-gray-600">Check Number:</span>
            <span class="ml-2">{{ payment.check_number }}</span>
          </div>
          <div v-if="payment.check_date">
            <span class="font-medium text-gray-600">Check Date:</span>
            <span class="ml-2">{{ new Date(payment.check_date).toLocaleDateString('en-PH') }}</span>
          </div>
        </div>
      </div>

      <!-- Payment Notes -->
      <div v-if="payment.notes" class="border rounded p-3 bg-gray-50">
        <h4 class="font-semibold mb-2 text-sm">Payment Notes</h4>
        <p class="text-sm text-gray-700">{{ payment.notes }}</p>
      </div>

      <!-- Action Selection -->
      <div class="border rounded p-4">
        <label class="font-medium text-sm mb-3 block">
          Action <span class="text-red-500">*</span>
        </label>
        <div class="flex gap-4">
          <div class="flex items-center">
            <RadioButton
              inputId="approve-payment"
              v-model="formData.action"
              value="approve"
            />
            <label for="approve-payment" class="ml-2 cursor-pointer">
              <span class="font-medium text-green-600">Approve Payment</span>
            </label>
          </div>
          <div class="flex items-center">
            <RadioButton
              inputId="reject-payment"
              v-model="formData.action"
              value="reject"
            />
            <label for="reject-payment" class="ml-2 cursor-pointer">
              <span class="font-medium text-red-600">Reject Payment</span>
            </label>
          </div>
        </div>
        <small v-if="errors.action" class="text-red-500 block mt-2">{{ errors.action }}</small>
      </div>

      <!-- Remarks -->
      <div class="flex flex-col gap-2">
        <label for="payment-remarks" class="font-medium text-sm">
          Approval/Rejection Remarks <span class="text-red-500">*</span>
        </label>
        <Textarea
          id="payment-remarks"
          v-model="formData.remarks"
          rows="3"
          :placeholder="formData.action === 'approve' ? 'Enter approval confirmation notes...' : formData.action === 'reject' ? 'Please provide a reason for rejection...' : 'Enter your remarks...'"
          :class="{ 'p-invalid': errors.remarks }"
        />
        <small v-if="errors.remarks" class="text-red-500">{{ errors.remarks }}</small>
      </div>

      <!-- Warning for Approval -->
      <div v-if="formData.action === 'approve'" class="p-3 bg-yellow-50 border border-yellow-200 rounded">
        <div class="flex items-start gap-2">
          <i class="pi pi-exclamation-triangle text-yellow-600 mt-1"></i>
          <div class="text-sm text-yellow-800">
            <p class="font-medium">Confirm Payment Approval</p>
            <p class="mt-1">
              By approving, you confirm that the payment of {{ formatCurrency(payment.payment_amount) }} 
              has been verified and authorized for processing.
            </p>
          </div>
        </div>
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
          :label="formData.action === 'approve' ? 'Approve Payment' : formData.action === 'reject' ? 'Reject Payment' : 'Submit'"
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
