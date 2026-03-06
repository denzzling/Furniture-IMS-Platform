<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { PurchaseOrder, Supplier, SupplierQuotation } from '@/types/procurement';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';

const props = defineProps<{
  purchaseOrder?: PurchaseOrder;
  suppliers?: Supplier[];
  quotations?: SupplierQuotation[];
}>();

const emit = defineEmits<{
  submit: [data: Partial<PurchaseOrder>];
  cancel: [];
}>();

const { canCreate, canUpdate } = useProcurementPermissions();

const formData = reactive({
  branch_id: props.purchaseOrder?.branch_id || null,
  supplier_id: props.purchaseOrder?.supplier_id || null,
  purchase_requisition_id: props.purchaseOrder?.purchase_requisition_id || null,
  rfq_id: props.purchaseOrder?.rfq_id || null,
  supplier_quotation_id: props.purchaseOrder?.supplier_quotation_id || null,
  order_date: props.purchaseOrder?.order_date ? new Date(props.purchaseOrder.order_date) : new Date(),
  expected_delivery_date: props.purchaseOrder?.expected_delivery_date ? new Date(props.purchaseOrder.expected_delivery_date) : null,
  payment_terms: props.purchaseOrder?.payment_terms || '',
  shipping_address: props.purchaseOrder?.shipping_address || '',
  items: props.purchaseOrder?.items || [],
  subtotal: props.purchaseOrder?.subtotal || 0,
  tax_amount: props.purchaseOrder?.tax_amount || 0,
  shipping_cost: props.purchaseOrder?.shipping_cost || 0,
  discount_amount: props.purchaseOrder?.discount_amount || 0,
  total_amount: props.purchaseOrder?.total_amount || 0,
  terms_conditions: props.purchaseOrder?.terms_conditions || '',
  notes: props.purchaseOrder?.notes || ''
});

const errors = reactive({
  branch_id: '',
  supplier_id: '',
  expected_delivery_date: '',
  payment_terms: '',
  shipping_address: '',
  items: ''
});

const selectedQuotation = ref<SupplierQuotation | null>(null);

const validateForm = (): boolean => {
  let isValid = true;
  
  Object.keys(errors).forEach(key => errors[key as keyof typeof errors] = '');

  if (!formData.branch_id) {
    errors.branch_id = 'Branch is required';
    isValid = false;
  }

  if (!formData.supplier_id) {
    errors.supplier_id = 'Supplier is required';
    isValid = false;
  }

  if (!formData.expected_delivery_date) {
    errors.expected_delivery_date = 'Expected delivery date is required';
    isValid = false;
  } else if (formData.expected_delivery_date <= formData.order_date) {
    errors.expected_delivery_date = 'Expected delivery must be after order date';
    isValid = false;
  }

  if (!formData.payment_terms.trim()) {
    errors.payment_terms = 'Payment terms are required';
    isValid = false;
  }

  if (!formData.shipping_address.trim()) {
    errors.shipping_address = 'Shipping address is required';
    isValid = false;
  }

  if (formData.items.length === 0) {
    errors.items = 'At least one item is required';
    isValid = false;
  }

  return isValid;
};

const importFromQuotation = () => {
  if (!selectedQuotation.value) return;

  formData.supplier_id = selectedQuotation.value.supplier_id;
  formData.rfq_id = selectedQuotation.value.rfq_id;
  formData.supplier_quotation_id = selectedQuotation.value.id;
  formData.payment_terms = selectedQuotation.value.payment_terms;
  formData.shipping_cost = selectedQuotation.value.shipping_cost || 0;
  
  formData.items = selectedQuotation.value.items.map(item => ({
    product_id: item.product_id,
    product_variation_id: item.product_variation_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    tax_rate: 0,
    discount_percent: item.discount_percent || 0,
    product: item.product,
    product_variation: item.product_variation
  })) as any;

  calculateTotals();
};

const newItem = reactive({
  product_id: null,
  product_variation_id: null,
  quantity: 0,
  unit_price: 0,
  tax_rate: 0,
  discount_percent: 0
});

const addItem = () => {
  if (!newItem.product_id || newItem.quantity <= 0 || newItem.unit_price <= 0) {
    return;
  }

  formData.items.push({ ...newItem } as any);
  
  // Reset
  newItem.product_id = null;
  newItem.product_variation_id = null;
  newItem.quantity = 0;
  newItem.unit_price = 0;
  newItem.tax_rate = 0;
  newItem.discount_percent = 0;

  calculateTotals();
};

const removeItem = (index: number) => {
  formData.items.splice(index, 1);
  calculateTotals();
};

const calculateItemTotal = (item: any) => {
  const subtotal = item.quantity * item.unit_price;
  const discount = subtotal * (item.discount_percent / 100);
  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * (item.tax_rate / 100);
  return afterDiscount + tax;
};

const calculateTotals = () => {
  formData.subtotal = formData.items.reduce((total, item) => {
    return total + (item.quantity * item.unit_price);
  }, 0);

  formData.discount_amount = formData.items.reduce((total, item) => {
    const itemSubtotal = item.quantity * item.unit_price;
    return total + (itemSubtotal * (item.discount_percent / 100));
  }, 0);

  formData.tax_amount = formData.items.reduce((total, item) => {
    const itemSubtotal = item.quantity * item.unit_price;
    const afterDiscount = itemSubtotal - (itemSubtotal * (item.discount_percent / 100));
    return total + (afterDiscount * (item.tax_rate / 100));
  }, 0);

  formData.total_amount = formData.subtotal - formData.discount_amount + formData.tax_amount + formData.shipping_cost;
};

const handleSubmit = () => {
  if (!validateForm()) return;
  
  const submitData = {
    ...formData,
    order_date: formData.order_date.toISOString().split('T')[0],
    expected_delivery_date: formData.expected_delivery_date ? formData.expected_delivery_date.toISOString().split('T')[0] : null
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

const requiredApprovers = computed(() => {
  if (formData.total_amount > 500000) {
    return ['Branch Manager', 'Procurement Manager', 'Finance Manager', 'CEO'];
  } else if (formData.total_amount > 100000) {
    return ['Branch Manager', 'Procurement Manager'];
  } else {
    return ['Branch Manager'];
  }
});
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Import from Quotation -->
    <div class="border rounded-lg p-4 bg-blue-50">
      <label class="font-medium text-sm mb-2 block">Import from Quotation</label>
      <div class="flex gap-3">
        <Dropdown
          v-model="selectedQuotation"
          :options="quotations"
          optionLabel="quotation_number"
          placeholder="Select quotation to import"
          :filter="true"
          class="flex-1"
        >
          <template #option="slotProps">
            <div>
              <div class="font-medium">{{ slotProps.option.quotation_number }}</div>
              <div class="text-xs text-gray-500">
                {{ slotProps.option.supplier?.name }} - {{ formatCurrency(slotProps.option.total_amount) }}
              </div>
            </div>
          </template>
        </Dropdown>
        <Button
          type="button"
          label="Import"
          icon="pi pi-download"
          @click="importFromQuotation"
          :disabled="!selectedQuotation"
        />
      </div>
    </div>

    <!-- Header Info -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Branch -->
      <div class="flex flex-col gap-2">
        <label for="branch" class="font-medium text-sm">
          Branch <span class="text-red-500">*</span>
        </label>
        <Dropdown
          id="branch"
          v-model="formData.branch_id"
          :options="[]"
          placeholder="Select branch"
          :filter="true"
          :class="{ 'p-invalid': errors.branch_id }"
        />
        <small v-if="errors.branch_id" class="text-red-500">{{ errors.branch_id }}</small>
      </div>

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
          :class="{ 'p-invalid': errors.supplier_id }"
        />
        <small v-if="errors.supplier_id" class="text-red-500">{{ errors.supplier_id }}</small>
      </div>

      <!-- Order Date -->
      <div class="flex flex-col gap-2">
        <label for="order-date" class="font-medium text-sm">Order Date</label>
        <Calendar
          id="order-date"
          v-model="formData.order_date"
          dateFormat="yy-mm-dd"
          showIcon
        />
      </div>

      <!-- Expected Delivery Date -->
      <div class="flex flex-col gap-2">
        <label for="delivery-date" class="font-medium text-sm">
          Expected Delivery Date <span class="text-red-500">*</span>
        </label>
        <Calendar
          id="delivery-date"
          v-model="formData.expected_delivery_date"
          dateFormat="yy-mm-dd"
          showIcon
          :minDate="formData.order_date"
          :class="{ 'p-invalid': errors.expected_delivery_date }"
        />
        <small v-if="errors.expected_delivery_date" class="text-red-500">{{ errors.expected_delivery_date }}</small>
      </div>

      <!-- Payment Terms -->
      <div class="flex flex-col gap-2">
        <label for="payment-terms" class="font-medium text-sm">
          Payment Terms <span class="text-red-500">*</span>
        </label>
        <Dropdown
          id="payment-terms"
          v-model="formData.payment_terms"
          :options="['Net 30', 'Net 60', 'Net 90', 'COD', '50% Advance']"
          placeholder="Select payment terms"
          :class="{ 'p-invalid': errors.payment_terms }"
        />
        <small v-if="errors.payment_terms" class="text-red-500">{{ errors.payment_terms }}</small>
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
          @input="calculateTotals"
        />
      </div>
    </div>

    <!-- Shipping Address -->
    <div class="flex flex-col gap-2">
      <label for="shipping-address" class="font-medium text-sm">
        Shipping Address <span class="text-red-500">*</span>
      </label>
      <Textarea
        id="shipping-address"
        v-model="formData.shipping_address"
        rows="2"
        placeholder="Enter complete shipping address"
        :class="{ 'p-invalid': errors.shipping_address }"
      />
      <small v-if="errors.shipping_address" class="text-red-500">{{ errors.shipping_address }}</small>
    </div>

    <!-- Items Section -->
    <div class="border rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Items</h3>
        <small v-if="errors.items" class="text-red-500">{{ errors.items }}</small>
      </div>

      <!-- Add Item Form -->
      <div class="grid grid-cols-1 md:grid-cols-7 gap-3 mb-4 p-3 bg-gray-50 rounded">
        <div class="md:col-span-2">
          <Dropdown v-model="newItem.product_id" :options="[]" placeholder="Product" class="w-full" />
        </div>
        <div>
          <InputNumber v-model="newItem.quantity" placeholder="Qty" :min="1" class="w-full" />
        </div>
        <div>
          <InputNumber v-model="newItem.unit_price" mode="currency" currency="PHP" placeholder="Price" class="w-full" />
        </div>
        <div>
          <InputNumber v-model="newItem.tax_rate" suffix="%" placeholder="Tax" :min="0" class="w-full" />
        </div>
        <div>
          <InputNumber v-model="newItem.discount_percent" suffix="%" placeholder="Disc" :min="0" class="w-full" />
        </div>
        <div>
          <Button type="button" label="Add" icon="pi pi-plus" size="small" @click="addItem" class="w-full" />
        </div>
      </div>

      <!-- Items Table -->
      <DataTable :value="formData.items" responsiveLayout="scroll" class="text-sm" showGridlines>
        <Column field="product.name" header="Product" />
        <Column field="quantity" header="Qty" />
        <Column field="unit_price" header="Unit Price">
          <template #body="{ data }">{{ formatCurrency(data.unit_price) }}</template>
        </Column>
        <Column field="tax_rate" header="Tax %">
          <template #body="{ data }">{{ data.tax_rate }}%</template>
        </Column>
        <Column field="discount_percent" header="Disc %">
          <template #body="{ data }">{{ data.discount_percent }}%</template>
        </Column>
        <Column header="Total">
          <template #body="{ data }">
            <span class="font-semibold">{{ formatCurrency(calculateItemTotal(data)) }}</span>
          </template>
        </Column>
        <Column header="Actions" style="width: 80px">
          <template #body="{ index }">
            <Button icon="pi pi-trash" severity="danger" text rounded @click="removeItem(index)" />
          </template>
        </Column>
      </DataTable>

      <!-- Totals -->
      <div class="mt-4 flex justify-end">
        <div class="w-full md:w-1/3 space-y-2">
          <div class="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span class="font-semibold">{{ formatCurrency(formData.subtotal) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>Discount:</span>
            <span class="font-semibold text-red-600">-{{ formatCurrency(formData.discount_amount) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>Tax:</span>
            <span class="font-semibold">{{ formatCurrency(formData.tax_amount) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>Shipping:</span>
            <span class="font-semibold">{{ formatCurrency(formData.shipping_cost) }}</span>
          </div>
          <div class="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total:</span>
            <span class="text-blue-600">{{ formatCurrency(formData.total_amount) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Required Approvers -->
    <div class="border rounded-lg p-4 bg-yellow-50">
      <h4 class="font-semibold mb-2">Required Approvals:</h4>
      <div class="flex flex-wrap gap-2">
        <Tag v-for="approver in requiredApprovers" :key="approver" :value="approver" severity="warning" />
      </div>
    </div>

    <!-- Terms & Conditions -->
    <div class="flex flex-col gap-2">
      <label for="terms" class="font-medium text-sm">Terms & Conditions</label>
      <Textarea id="terms" v-model="formData.terms_conditions" rows="3" />
    </div>

    <!-- Notes -->
    <div class="flex flex-col gap-2">
      <label for="notes" class="font-medium text-sm">Notes</label>
      <Textarea id="notes" v-model="formData.notes" rows="2" />
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end gap-3 pt-4 border-t">
      <Button type="button" label="Cancel" severity="secondary" outlined @click="emit('cancel')" />
      <Button v-if="canCreate || canUpdate" type="submit" label="Create Purchase Order" icon="pi pi-check" />
    </div>
  </form>
</template>
