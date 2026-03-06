<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { GoodsReceipt, PurchaseOrder } from '@/types/procurement';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';

const props = defineProps<{
  goodsReceipt?: GoodsReceipt;
  purchaseOrder?: PurchaseOrder;
}>();

const emit = defineEmits<{
  submit: [data: Partial<GoodsReceipt>];
  cancel: [];
}>();

const { canCreate, canUpdate } = useProcurementPermissions();

const formData = reactive({
  purchase_order_id: props.goodsReceipt?.purchase_order_id || props.purchaseOrder?.id || null,
  receipt_date: props.goodsReceipt?.receipt_date ? new Date(props.goodsReceipt.receipt_date) : new Date(),
  delivery_note_number: props.goodsReceipt?.delivery_note_number || '',
  vehicle_number: props.goodsReceipt?.vehicle_number || '',
  driver_name: props.goodsReceipt?.driver_name || '',
  driver_contact: props.goodsReceipt?.driver_contact || '',
  items: props.goodsReceipt?.items || (props.purchaseOrder?.items?.map(item => ({
    po_item_id: item.id,
    product_id: item.product_id,
    product_variation_id: item.product_variation_id,
    expected_quantity: item.quantity,
    received_quantity: 0,
    damaged_quantity: 0,
    condition: 'Good',
    discrepancy_notes: '',
    quality_notes: '',
    product: item.product,
    product_variation: item.product_variation
  })) || []),
  notes: props.goodsReceipt?.notes || ''
});

const errors = reactive({
  delivery_note_number: '',
  vehicle_number: '',
  driver_name: '',
  items: ''
});

const validateForm = (): boolean => {
  let isValid = true;
  
  Object.keys(errors).forEach(key => errors[key as keyof typeof errors] = '');

  if (!formData.delivery_note_number.trim()) {
    errors.delivery_note_number = 'Delivery note number is required';
    isValid = false;
  }

  if (!formData.vehicle_number.trim()) {
    errors.vehicle_number = 'Vehicle number is required';
    isValid = false;
  }

  if (!formData.driver_name.trim()) {
    errors.driver_name = 'Driver name is required';
    isValid = false;
  }

  const hasUnprocessedItems = formData.items.some(item => 
    item.received_quantity === null || item.received_quantity === undefined
  );
  
  if (hasUnprocessedItems) {
    errors.items = 'Please verify received quantities for all items';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = () => {
  if (!validateForm()) return;
  
  const submitData = {
    ...formData,
    receipt_date: formData.receipt_date.toISOString()
  };

  emit('submit', submitData);
};

const hasDiscrepancy = (item: any) => {
  return item.expected_quantity !== (item.received_quantity + item.damaged_quantity);
};

const getItemStatus = (item: any) => {
  if (item.received_quantity === item.expected_quantity && item.damaged_quantity === 0) {
    return { label: 'Complete', severity: 'success' };
  }
  if (item.damaged_quantity > 0) {
    return { label: 'With Damage', severity: 'danger' };
  }
  if (item.received_quantity < item.expected_quantity) {
    return { label: 'Short', severity: 'warning' };
  }
  if (item.received_quantity > item.expected_quantity) {
    return { label: 'Excess', severity: 'info' };
  }
  return { label: 'Pending', severity: 'secondary' };
};

const updateReceivedQuantity = (item: any) => {
  // Auto-calculate damaged to maintain total
  const total = item.received_quantity + item.damaged_quantity;
  if (total > item.expected_quantity) {
    item.damaged_quantity = Math.max(0, item.expected_quantity - item.received_quantity);
  }
};

const conditionOptions = ['Good', 'Minor Damage', 'Major Damage', 'Defective', 'Expired'];

const totalExpected = computed(() => formData.items.reduce((sum, item) => sum + item.expected_quantity, 0));
const totalReceived = computed(() => formData.items.reduce((sum, item) => sum + item.received_quantity, 0));
const totalDamaged = computed(() => formData.items.reduce((sum, item) => sum + item.damaged_quantity, 0));
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- PO Details (Read-only) -->
    <div v-if="purchaseOrder" class="border rounded-lg p-4 bg-gray-50">
      <h3 class="text-lg font-semibold mb-3">Purchase Order Details</h3>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span class="font-medium">PO Number:</span>
          <span class="ml-2">{{ purchaseOrder.po_number }}</span>
        </div>
        <div>
          <span class="font-medium">Supplier:</span>
          <span class="ml-2">{{ purchaseOrder.supplier?.name }}</span>
        </div>
        <div>
          <span class="font-medium">Order Date:</span>
          <span class="ml-2">{{ new Date(purchaseOrder.order_date).toLocaleDateString('en-PH') }}</span>
        </div>
        <div>
          <span class="font-medium">Total Amount:</span>
          <span class="ml-2">₱{{ purchaseOrder.total_amount?.toLocaleString('en-PH') }}</span>
        </div>
      </div>
    </div>

    <!-- Receipt Header -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Receipt Date & Time -->
      <div class="flex flex-col gap-2">
        <label for="receipt-date" class="font-medium text-sm">Receipt Date & Time</label>
        <Calendar
          id="receipt-date"
          v-model="formData.receipt_date"
          showTime
          hourFormat="12"
          showIcon
        />
      </div>

      <!-- Delivery Note Number -->
      <div class="flex flex-col gap-2">
        <label for="delivery-note" class="font-medium text-sm">
          Delivery Note Number <span class="text-red-500">*</span>
        </label>
        <InputText
          id="delivery-note"
          v-model="formData.delivery_note_number"
          placeholder="Enter delivery note number"
          :class="{ 'p-invalid': errors.delivery_note_number }"
        />
        <small v-if="errors.delivery_note_number" class="text-red-500">{{ errors.delivery_note_number }}</small>
      </div>

      <!-- Vehicle Number -->
      <div class="flex flex-col gap-2">
        <label for="vehicle" class="font-medium text-sm">
          Vehicle Number <span class="text-red-500">*</span>
        </label>
        <InputText
          id="vehicle"
          v-model="formData.vehicle_number"
          placeholder="e.g., ABC-1234"
          :class="{ 'p-invalid': errors.vehicle_number }"
        />
        <small v-if="errors.vehicle_number" class="text-red-500">{{ errors.vehicle_number }}</small>
      </div>

      <!-- Driver Name -->
      <div class="flex flex-col gap-2">
        <label for="driver-name" class="font-medium text-sm">
          Driver Name <span class="text-red-500">*</span>
        </label>
        <InputText
          id="driver-name"
          v-model="formData.driver_name"
          placeholder="Enter driver name"
          :class="{ 'p-invalid': errors.driver_name }"
        />
        <small v-if="errors.driver_name" class="text-red-500">{{ errors.driver_name }}</small>
      </div>

      <!-- Driver Contact -->
      <div class="flex flex-col gap-2 md:col-span-2">
        <label for="driver-contact" class="font-medium text-sm">Driver Contact Number</label>
        <InputText
          id="driver-contact"
          v-model="formData.driver_contact"
          placeholder="Enter contact number"
        />
      </div>
    </div>

    <!-- Items Verification -->
    <div class="border rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Items Verification</h3>
        <small v-if="errors.items" class="text-red-500">{{ errors.items }}</small>
      </div>

      <!-- Summary -->
      <div class="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ totalExpected }}</div>
          <div class="text-xs text-gray-600">Expected</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ totalReceived }}</div>
          <div class="text-xs text-gray-600">Received</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-red-600">{{ totalDamaged }}</div>
          <div class="text-xs text-gray-600">Damaged</div>
        </div>
      </div>

      <!-- Items Table -->
      <DataTable
        :value="formData.items"
        responsiveLayout="scroll"
        class="text-sm"
        showGridlines
      >
        <Column header="Product" style="min-width: 200px">
          <template #body="{ data }">
            <div>
              <div class="font-medium">{{ data.product?.name }}</div>
              <div v-if="data.product_variation" class="text-xs text-gray-500">
                {{ data.product_variation.name }}
              </div>
            </div>
          </template>
        </Column>

        <Column field="expected_quantity" header="Expected" style="width: 100px">
          <template #body="{ data }">
            <span class="font-semibold">{{ data.expected_quantity }}</span>
          </template>
        </Column>

        <Column header="Received *" style="width: 120px">
          <template #body="{ data }">
            <InputNumber
              v-model="data.received_quantity"
              :min="0"
              :max="data.expected_quantity * 2"
              @input="updateReceivedQuantity(data)"
              class="w-full"
            />
          </template>
        </Column>

        <Column header="Damaged" style="width: 120px">
          <template #body="{ data }">
            <InputNumber
              v-model="data.damaged_quantity"
              :min="0"
              class="w-full"
            />
          </template>
        </Column>

        <Column header="Condition" style="width: 150px">
          <template #body="{ data }">
            <Dropdown
              v-model="data.condition"
              :options="conditionOptions"
              class="w-full"
            />
          </template>
        </Column>

        <Column header="Status" style="width: 120px">
          <template #body="{ data }">
            <Tag
              :value="getItemStatus(data).label"
              :severity="getItemStatus(data).severity"
            />
          </template>
        </Column>

        <Column header="Discrepancy Notes" style="min-width: 200px">
          <template #body="{ data }">
            <Textarea
              v-model="data.discrepancy_notes"
              rows="1"
              :placeholder="hasDiscrepancy(data) ? 'Explain discrepancy' : 'Optional'"
              class="w-full text-xs"
            />
          </template>
        </Column>

        <Column header="Quality Notes" style="min-width: 200px">
          <template #body="{ data }">
            <Textarea
              v-model="data.quality_notes"
              rows="1"
              placeholder="Optional quality remarks"
              class="w-full text-xs"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- General Notes -->
    <div class="flex flex-col gap-2">
      <label for="notes" class="font-medium text-sm">General Notes</label>
      <Textarea
        id="notes"
        v-model="formData.notes"
        rows="3"
        placeholder="Any additional observations or notes"
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
        label="Confirm Receipt"
        icon="pi pi-check"
      />
    </div>
  </form>
</template>
