<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { SupplierPayment, PurchaseOrder } from '@/types/procurement';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';

const props = defineProps<{
  payment?: SupplierPayment;
  purchaseOrder?: PurchaseOrder;
}>();

const emit = defineEmits<{
  submit: [data: Partial<SupplierPayment>];
  cancel: [];
}>();

const { canCreate, canUpdate } = useProcurementPermissions();

const formData = reactive({
  purchase_order_id: props.payment?.purchase_order_id || props.purchaseOrder?.id || null,
  payment_amount: props.payment?.payment_amount || 0,
  payment_method: props.payment?.payment_method || '',
  payment_date: props.payment?.payment_date ? new Date(props.payment.payment_date) : new Date(),
  reference_number: props.payment?.reference_number || '',
  bank_name: props.payment?.bank_name || '',
  account_number: props.payment?.account_number || '',
  check_number: props.payment?.check_number || '',
  check_date: props.payment?.check_date ? new Date(props.payment.check_date) : null,
  notes: props.payment?.notes || ''
});

const errors = reactive({
  payment_amount: '',
  payment_method: '',
  reference_number: '',
  bank_name: '',
  check_number: '',
  check_date: ''
});

const paymentMethods = ['Bank Transfer', 'Check', 'Cash', 'Credit Card', 'Debit Card'];

const validateForm = (): boolean => {
  let isValid = true;
  
  Object.keys(errors).forEach(key => errors[key as keyof typeof errors] = '');

  if (formData.payment_amount <= 0) {
    errors.payment_amount = 'Payment amount must be greater than 0';
    isValid = false;
  }

  if (props.purchaseOrder && formData.payment_amount > props.purchaseOrder.total_amount) {
    errors.payment_amount = 'Payment amount cannot exceed PO total';
    isValid = false;
  }

  if (!formData.payment_method) {
    errors.payment_method = 'Payment method is required';
    isValid = false;
  }

  if (!formData.reference_number.trim()) {
    errors.reference_number = 'Reference number is required';
    isValid = false;
  }

  // Conditional validation based on payment method
  if (formData.payment_method === 'Bank Transfer') {
    if (!formData.bank_name.trim()) {
      errors.bank_name = 'Bank name is required for bank transfers';
      isValid = false;
    }
  }

  if (formData.payment_method === 'Check') {
    if (!formData.check_number.trim()) {
      errors.check_number = 'Check number is required';
      isValid = false;
    }
    if (!formData.check_date) {
      errors.check_date = 'Check date is required';
      isValid = false;
    }
  }

  return isValid;
};

const handleSubmit = () => {
  if (!validateForm()) return;
  
  const submitData = {
    ...formData,
    payment_date: formData.payment_date.toISOString().split('T')[0],
    check_date: formData.check_date ? formData.check_date.toISOString().split('T')[0] : null
  };

  emit('submit', submitData);
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(value);
};

const remainingBalance = computed(() => {
  if (!props.purchaseOrder) return 0;
  const totalPaid = props.purchaseOrder.paid_amount || 0;
  return props.purchaseOrder.total_amount - totalPaid - formData.payment_amount;
});

const showBankFields = computed(() => formData.payment_method === 'Bank Transfer');
const showCheckFields = computed(() => formData.payment_method === 'Check');
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- PO Details (Read-only) -->
    <div v-if="purchaseOrder" class="border rounded-lg p-4 bg-gray-50">
      <h3 class="text-lg font-semibold mb-3">Purchase Order Details</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div>
          <span class="font-medium">PO Number:</span>
          <span class="ml-2">{{ purchaseOrder.po_number }}</span>
        </div>
        <div>
          <span class="font-medium">Supplier:</span>
          <span class="ml-2">{{ purchaseOrder.supplier?.name }}</span>
        </div>
        <div>
          <span class="font-medium">Total Amount:</span>
          <span class="ml-2 font-semibold text-blue-600">{{ formatCurrency(purchaseOrder.total_amount) }}</span>
        </div>
        <div>
          <span class="font-medium">Paid Amount:</span>
          <span class="ml-2 font-semibold text-green-600">{{ formatCurrency(purchaseOrder.paid_amount || 0) }}</span>
        </div>
        <div>
          <span class="font-medium">Balance:</span>
          <span class="ml-2 font-semibold text-orange-600">
            {{ formatCurrency((purchaseOrder.total_amount - (purchaseOrder.paid_amount || 0))) }}
          </span>
        </div>
        <div>
          <span class="font-medium">Payment Terms:</span>
          <span class="ml-2">{{ purchaseOrder.payment_terms }}</span>
        </div>
      </div>
    </div>

    <!-- Payment Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Payment Amount -->
      <div class="flex flex-col gap-2">
        <label for="amount" class="font-medium text-sm">
          Payment Amount <span class="text-red-500">*</span>
        </label>
        <InputNumber
          id="amount"
          v-model="formData.payment_amount"
          mode="currency"
          currency="PHP"
          locale="en-PH"
          :min="0"
          :max="purchaseOrder ? (purchaseOrder.total_amount - (purchaseOrder.paid_amount || 0)) : undefined"
          :class="{ 'p-invalid': errors.payment_amount }"
        />
        <small v-if="errors.payment_amount" class="text-red-500">{{ errors.payment_amount }}</small>
        <small v-if="remainingBalance >= 0" class="text-gray-600">
          Remaining balance after this payment: {{ formatCurrency(remainingBalance) }}
        </small>
      </div>

      <!-- Payment Method -->
      <div class="flex flex-col gap-2">
        <label for="method" class="font-medium text-sm">
          Payment Method <span class="text-red-500">*</span>
        </label>
        <Dropdown
          id="method"
          v-model="formData.payment_method"
          :options="paymentMethods"
          placeholder="Select payment method"
          :class="{ 'p-invalid': errors.payment_method }"
        />
        <small v-if="errors.payment_method" class="text-red-500">{{ errors.payment_method }}</small>
      </div>

      <!-- Payment Date -->
      <div class="flex flex-col gap-2">
        <label for="payment-date" class="font-medium text-sm">Payment Date</label>
        <Calendar
          id="payment-date"
          v-model="formData.payment_date"
          dateFormat="yy-mm-dd"
          showIcon
        />
      </div>

      <!-- Reference Number -->
      <div class="flex flex-col gap-2">
        <label for="reference" class="font-medium text-sm">
          Reference Number <span class="text-red-500">*</span>
        </label>
        <InputText
          id="reference"
          v-model="formData.reference_number"
          placeholder="Transaction/Receipt number"
          :class="{ 'p-invalid': errors.reference_number }"
        />
        <small v-if="errors.reference_number" class="text-red-500">{{ errors.reference_number }}</small>
      </div>
    </div>

    <!-- Bank Transfer Fields -->
    <div v-if="showBankFields" class="border rounded-lg p-4 bg-blue-50">
      <h4 class="font-semibold mb-3">Bank Transfer Details</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label for="bank-name" class="font-medium text-sm">
            Bank Name <span class="text-red-500">*</span>
          </label>
          <InputText
            id="bank-name"
            v-model="formData.bank_name"
            placeholder="Enter bank name"
            :class="{ 'p-invalid': errors.bank_name }"
          />
          <small v-if="errors.bank_name" class="text-red-500">{{ errors.bank_name }}</small>
        </div>

        <div class="flex flex-col gap-2">
          <label for="account-number" class="font-medium text-sm">Account Number</label>
          <InputText
            id="account-number"
            v-model="formData.account_number"
            placeholder="Last 4 digits or full account"
          />
        </div>
      </div>
    </div>

    <!-- Check Fields -->
    <div v-if="showCheckFields" class="border rounded-lg p-4 bg-green-50">
      <h4 class="font-semibold mb-3">Check Details</h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="flex flex-col gap-2">
          <label for="check-number" class="font-medium text-sm">
            Check Number <span class="text-red-500">*</span>
          </label>
          <InputText
            id="check-number"
            v-model="formData.check_number"
            placeholder="Enter check number"
            :class="{ 'p-invalid': errors.check_number }"
          />
          <small v-if="errors.check_number" class="text-red-500">{{ errors.check_number }}</small>
        </div>

        <div class="flex flex-col gap-2">
          <label for="check-date" class="font-medium text-sm">
            Check Date <span class="text-red-500">*</span>
          </label>
          <Calendar
            id="check-date"
            v-model="formData.check_date"
            dateFormat="yy-mm-dd"
            showIcon
            :class="{ 'p-invalid': errors.check_date }"
          />
          <small v-if="errors.check_date" class="text-red-500">{{ errors.check_date }}</small>
        </div>

        <div class="flex flex-col gap-2">
          <label for="check-bank" class="font-medium text-sm">Bank Name</label>
          <InputText
            id="check-bank"
            v-model="formData.bank_name"
            placeholder="Bank issuing the check"
          />
        </div>
      </div>
    </div>

    <!-- Notes -->
    <div class="flex flex-col gap-2">
      <label for="notes" class="font-medium text-sm">Notes</label>
      <Textarea
        id="notes"
        v-model="formData.notes"
        rows="3"
        placeholder="Additional payment notes or remarks"
      />
    </div>

    <!-- Payment Summary -->
    <div v-if="purchaseOrder" class="border rounded-lg p-4 bg-yellow-50">
      <h4 class="font-semibold mb-2">Payment Summary</h4>
      <div class="space-y-1 text-sm">
        <div class="flex justify-between">
          <span>PO Total:</span>
          <span class="font-semibold">{{ formatCurrency(purchaseOrder.total_amount) }}</span>
        </div>
        <div class="flex justify-between">
          <span>Previously Paid:</span>
          <span class="font-semibold">{{ formatCurrency(purchaseOrder.paid_amount || 0) }}</span>
        </div>
        <div class="flex justify-between text-blue-600">
          <span>This Payment:</span>
          <span class="font-semibold">{{ formatCurrency(formData.payment_amount) }}</span>
        </div>
        <div class="flex justify-between pt-2 border-t text-lg font-bold">
          <span>Remaining Balance:</span>
          <span :class="remainingBalance === 0 ? 'text-green-600' : 'text-orange-600'">
            {{ formatCurrency(remainingBalance) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end gap-3 pt-4 border-t">
      <Button
        type="button"
        label="Cancel"
        severity="secondary"
        outlined
        @click="emit('cancel')"
      />
      <Button
        v-if="canCreate || canUpdate"
        type="submit"
        label="Submit Payment"
        icon="pi pi-check"
      />
    </div>
  </form>
</template>
