<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { SupplierQuotation, RequestForQuotation, Supplier } from '@/types/procurement';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';

const props = defineProps<{
  quotation?: SupplierQuotation;
  rfq?: RequestForQuotation;
  suppliers?: Supplier[];
}>();

const emit = defineEmits<{
  submit: [data: Partial<SupplierQuotation>];
  cancel: [];
}>();

const { canCreate, canUpdate } = useProcurementPermissions();

const formData = reactive({
  rfq_id: props.quotation?.rfq_id || props.rfq?.id || null,
  supplier_id: props.quotation?.supplier_id || null,
  quotation_date: props.quotation?.quotation_date ? new Date(props.quotation.quotation_date) : new Date(),
  valid_until: props.quotation?.valid_until ? new Date(props.quotation.valid_until) : null,
  payment_terms: props.quotation?.payment_terms || '',
  delivery_days: props.quotation?.delivery_days || 0,
  shipping_cost: props.quotation?.shipping_cost || 0,
  items: props.quotation?.items || (props.rfq?.items?.map(item => ({
    rfq_item_id: item.id,
    product_id: item.product_id,
    product_variation_id: item.product_variation_id,
    quantity: item.quantity,
    unit_price: 0,
    discount_percent: 0,
    specifications: item.specifications,
    product: item.product,
    product_variation: item.product_variation
  })) || []),
  notes: props.quotation?.notes || ''
});

const errors = reactive({
  supplier_id: '',
  valid_until: '',
  payment_terms: '',
  delivery_days: '',
  items: ''
});

const validateForm = (): boolean => {
  let isValid = true;
  
  Object.keys(errors).forEach(key => errors[key as keyof typeof errors] = '');

  if (!formData.supplier_id) {
    errors.supplier_id = 'Supplier is required';
    isValid = false;
  }

  if (!formData.valid_until) {
    errors.valid_until = 'Valid until date is required';
    isValid = false;
  } else if (formData.valid_until <= formData.quotation_date) {
    errors.valid_until = 'Valid until must be after quotation date';
    isValid = false;
  }

  if (!formData.payment_terms.trim()) {
    errors.payment_terms = 'Payment terms are required';
    isValid = false;
  }

  if (formData.delivery_days <= 0) {
    errors.delivery_days = 'Delivery days must be greater than 0';
    isValid = false;
  }

  const hasInvalidItems = formData.items.some(item => !item.unit_price || item.unit_price <= 0);
  if (hasInvalidItems) {
    errors.items = 'All items must have valid unit prices';
    isValid = false;
  }

  return isValid;
};

const calculateItemTotal = (item: any) => {
  const subtotal = item.quantity * item.unit_price;
  const discount = subtotal * (item.discount_percent / 100);
  return subtotal - discount;
};

const subtotal = computed(() => {
  return formData.items.reduce((total, item) => total + calculateItemTotal(item), 0);
});

const totalAmount = computed(() => {
  return subtotal.value + formData.shipping_cost;
});

const handleSubmit = () => {
  if (!validateForm()) return;
  
  const submitData = {
    ...formData,
    quotation_date: formData.quotation_date.toISOString().split('T')[0],
    valid_until: formData.valid_until ? formData.valid_until.toISOString().split('T')[0] : null,
    subtotal: subtotal.value,
    total_amount: totalAmount.value
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
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- RFQ Details (Read-only) -->
    <div v-if="rfq" class="border rounded-lg p-4 bg-gray-50">
      <h3 class="text-lg font-semibold mb-3">RFQ Details</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span class="font-medium">RFQ Number:</span>
          <span class="ml-2">{{ rfq.rfq_number }}</span>
        </div>
        <div>
          <span class="font-medium">Issue Date:</span>
          <span class="ml-2">{{ new Date(rfq.issue_date).toLocaleDateString('en-PH') }}</span>
        </div>
        <div>
          <span class="font-medium">Deadline:</span>
          <span class="ml-2">{{ new Date(rfq.deadline_date).toLocaleDateString('en-PH') }}</span>
        </div>
        <div class="md:col-span-3">
          <span class="font-medium">Title:</span>
          <span class="ml-2">{{ rfq.title }}</span>
        </div>
      </div>
    </div>

    <!-- Quotation Header -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Supplier -->
      <div class="flex flex-col gap-2">
        <label for="supplier" class="font-medium text-sm">
          Supplier <span class="text-red-500">*</span>
        </label>
        <Dropdown
          id="supplier"
          v-model="formData.supplier_id"
          :options="suppliers"
          optionLabel="name"
          optionValue="id"
          placeholder="Select supplier"
          :filter="true"
          :disabled="!!quotation"
          :class="{ 'p-invalid': errors.supplier_id }"
        />
        <small v-if="errors.supplier_id" class="text-red-500">{{ errors.supplier_id }}</small>
      </div>

      <!-- Quotation Date -->
      <div class="flex flex-col gap-2">
        <label for="quotation-date" class="font-medium text-sm">Quotation Date</label>
        <Calendar
          id="quotation-date"
          v-model="formData.quotation_date"
          dateFormat="yy-mm-dd"
          showIcon
        />
      </div>

      <!-- Valid Until -->
      <div class="flex flex-col gap-2">
        <label for="valid-until" class="font-medium text-sm">
          Valid Until <span class="text-red-500">*</span>
        </label>
        <Calendar
          id="valid-until"
          v-model="formData.valid_until"
          dateFormat="yy-mm-dd"
          showIcon
          :minDate="formData.quotation_date"
          :class="{ 'p-invalid': errors.valid_until }"
        />
        <small v-if="errors.valid_until" class="text-red-500">{{ errors.valid_until }}</small>
      </div>

      <!-- Payment Terms -->
      <div class="flex flex-col gap-2">
        <label for="payment-terms" class="font-medium text-sm">
          Payment Terms <span class="text-red-500">*</span>
        </label>
        <Dropdown
          id="payment-terms"
          v-model="formData.payment_terms"
          :options="['Net 30', 'Net 60', 'Net 90', 'COD', '50% Advance', 'Custom']"
          placeholder="Select payment terms"
          :class="{ 'p-invalid': errors.payment_terms }"
        />
        <small v-if="errors.payment_terms" class="text-red-500">{{ errors.payment_terms }}</small>
      </div>

      <!-- Delivery Days -->
      <div class="flex flex-col gap-2">
        <label for="delivery-days" class="font-medium text-sm">
          Delivery Days <span class="text-red-500">*</span>
        </label>
        <InputNumber
          id="delivery-days"
          v-model="formData.delivery_days"
          :min="1"
          suffix=" days"
          :class="{ 'p-invalid': errors.delivery_days }"
        />
        <small v-if="errors.delivery_days" class="text-red-500">{{ errors.delivery_days }}</small>
      </div>

      <!-- Shipping Cost -->
      <div class="flex flex-col gap-2">
        <label for="shipping-cost" class="font-medium text-sm">Shipping Cost</label>
        <InputNumber
          id="shipping-cost"
          v-model="formData.shipping_cost"
          mode="currency"
          currency="PHP"
          locale="en-PH"
          :min="0"
        />
      </div>
    </div>

    <!-- Items Section -->
    <div class="border rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Quotation Items</h3>
        <small v-if="errors.items" class="text-red-500">{{ errors.items }}</small>
      </div>

      <DataTable
        :value="formData.items"
        responsiveLayout="scroll"
        class="text-sm"
        showGridlines
      >
        <Column field="product.name" header="Product" style="min-width: 200px">
          <template #body="{ data }">
            <div>
              <div class="font-medium">{{ data.product?.name }}</div>
              <div v-if="data.product_variation" class="text-xs text-gray-500">
                {{ data.product_variation.name }}
              </div>
            </div>
          </template>
        </Column>
        <Column field="quantity" header="Qty" style="width: 80px" />
        <Column header="Unit Price *" style="width: 150px">
          <template #body="{ data }">
            <InputNumber
              v-model="data.unit_price"
              mode="currency"
              currency="PHP"
              locale="en-PH"
              :min="0"
              class="w-full"
            />
          </template>
        </Column>
        <Column header="Discount %" style="width: 120px">
          <template #body="{ data }">
            <InputNumber
              v-model="data.discount_percent"
              suffix="%"
              :min="0"
              :max="100"
              class="w-full"
            />
          </template>
        </Column>
        <Column header="Total" style="width: 150px">
          <template #body="{ data }">
            <span class="font-semibold">{{ formatCurrency(calculateItemTotal(data)) }}</span>
          </template>
        </Column>
      </DataTable>

      <!-- Totals Summary -->
      <div class="mt-4 flex justify-end">
        <div class="w-full md:w-1/3 space-y-2">
          <div class="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span class="font-semibold">{{ formatCurrency(subtotal) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>Shipping Cost:</span>
            <span class="font-semibold">{{ formatCurrency(formData.shipping_cost) }}</span>
          </div>
          <div class="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total Amount:</span>
            <span class="text-blue-600">{{ formatCurrency(totalAmount) }}</span>
          </div>
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
        placeholder="Additional notes or conditions"
      />
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
        label="Submit Quotation"
        icon="pi pi-check"
      />
    </div>
  </form>
</template>
