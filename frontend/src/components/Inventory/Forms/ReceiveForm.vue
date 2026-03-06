<template>
  <div class="receive-form">
    <form @submit.prevent="handleSubmit">
      <!-- Transfer Summary (Read-only) -->
      <Card class="mb-4 bg-gray-50">
        <template #title>
          <span class="text-lg">Transfer Summary</span>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">Transfer Number</label>
              <p class="font-semibold text-lg">{{ transfer?.transfer_number }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">From Branch</label>
              <p class="font-medium">{{ transfer?.from_branch?.name }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">Shipped Date</label>
              <p class="font-medium">{{ formatDate(transfer?.shipped_date) }}</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Receiving Items -->
      <Card class="mb-4">
        <template #title>
          <span class="text-lg">Receive Items</span>
        </template>
        <template #content>
          <div class="space-y-4">
            <div
              v-for="(item, index) in formData.items"
              :key="index"
              class="border rounded-lg p-4"
              :class="{
                'bg-green-50 border-green-200': item.condition === 'good',
                'bg-red-50 border-red-200': item.condition === 'damaged' || item.condition === 'defective',
                'bg-gray-50': item.condition === null
              }"
            >
              <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <!-- Product Info -->
                <div class="md:col-span-4">
                  <div class="flex items-center gap-3">
                    <Avatar
                      v-if="item.product_image"
                      :image="item.product_image"
                      size="large"
                      shape="square"
                    />
                    <Avatar
                      v-else
                      icon="pi pi-box"
                      size="large"
                      shape="square"
                      class="bg-gray-200"
                    />
                    <div>
                      <div class="font-semibold">{{ item.product_name }}</div>
                      <div class="text-sm text-gray-500">SKU: {{ item.sku }}</div>
                    </div>
                  </div>
                </div>

                <!-- Shipped Quantity (read-only) -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium mb-2">Shipped Qty</label>
                  <InputNumber
                    v-model="item.shipped_quantity"
                    class="w-full"
                    :disabled="true"
                  />
                </div>

                <!-- Received Quantity -->
                <div class="md:col-span-2">
                  <label :for="`received-${index}`" class="block text-sm font-medium mb-2">
                    Received Qty <span class="text-red-500">*</span>
                  </label>
                  <InputNumber
                    :id="`received-${index}`"
                    v-model="item.received_quantity"
                    class="w-full"
                    :min="0"
                    :max="item.shipped_quantity"
                    @input="onReceivedChange(index)"
                  />
                </div>

                <!-- Damaged Quantity -->
                <div class="md:col-span-2">
                  <label :for="`damaged-${index}`" class="block text-sm font-medium mb-2">
                    Damaged Qty
                  </label>
                  <InputNumber
                    :id="`damaged-${index}`"
                    v-model="item.damaged_quantity"
                    class="w-full"
                    :min="0"
                    :max="item.received_quantity"
                    @input="validateDamagedQty(index)"
                  />
                </div>

                <!-- Condition -->
                <div class="md:col-span-2">
                  <label :for="`condition-${index}`" class="block text-sm font-medium mb-2">
                    Condition <span class="text-red-500">*</span>
                  </label>
                  <Select
                    :id="`condition-${index}`"
                    v-model="item.condition"
                    :options="conditionOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Select"
                    class="w-full"
                  />
                </div>

                <!-- Notes -->
                <div class="md:col-span-12">
                  <label :for="`notes-${index}`" class="block text-sm font-medium mb-2">
                    Notes
                  </label>
                  <InputText
                    :id="`notes-${index}`"
                    v-model="item.notes"
                    placeholder="Any observations or issues..."
                    class="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Receipt Totals -->
          <div class="mt-6 pt-4 border-t">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-sm text-gray-600 mb-1">Total Shipped</div>
                <div class="text-2xl font-bold text-blue-600">{{ totalShipped }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-600 mb-1">Total Received</div>
                <div class="text-2xl font-bold text-green-600">{{ totalReceived }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-600 mb-1">Total Damaged</div>
                <div class="text-2xl font-bold text-red-600">{{ totalDamaged }}</div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          outlined
          @click="handleCancel"
          :disabled="submitting"
        />
        <Button
          type="submit"
          label="Complete Receipt"
          icon="pi pi-check"
          severity="success"
          :loading="submitting"
          :disabled="!isFormValid"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/dropdown';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';

import type { StockTransfer } from '../../types/inventory';

/**
 * Props interface
 */
interface Props {
  transfer: StockTransfer;
}

/**
 * Emits interface
 */
interface Emits {
  (e: 'save', data: any): void;
  (e: 'cancel'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Composables
const toast = useToast();

// Refs
const submitting = ref(false);

// Condition options
const conditionOptions = [
  { label: 'Good', value: 'good' },
  { label: 'Damaged', value: 'damaged' },
  { label: 'Defective', value: 'defective' },
];

// Form data
const formData = reactive({
  items: [] as Array<{
    transfer_item_id: number;
    product_name: string;
    sku: string;
    product_image?: string;
    shipped_quantity: number;
    received_quantity: number;
    damaged_quantity: number;
    condition: string | null;
    notes: string;
  }>,
});

/**
 * Total shipped quantity
 */
const totalShipped = computed(() => {
  return formData.items.reduce((sum, item) => sum + item.shipped_quantity, 0);
});

/**
 * Total received quantity
 */
const totalReceived = computed(() => {
  return formData.items.reduce((sum, item) => sum + item.received_quantity, 0);
});

/**
 * Total damaged quantity
 */
const totalDamaged = computed(() => {
  return formData.items.reduce((sum, item) => sum + item.damaged_quantity, 0);
});

/**
 * Check if form is valid
 */
const isFormValid = computed(() => {
  return formData.items.every((item) => {
    return (
      item.received_quantity >= 0 &&
      item.received_quantity <= item.shipped_quantity &&
      item.damaged_quantity <= item.received_quantity &&
      item.condition !== null
    );
  });
});

/**
 * Format date
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Handle received quantity change
 */
const onReceivedChange = (index: number): void => {
  const item = formData.items[index];
  
  // Auto-set damaged to 0 if not set
  if (item.damaged_quantity === null) {
    item.damaged_quantity = 0;
  }
  
  // Auto-set condition to 'good' if received matches shipped and no damage
  if (item.received_quantity === item.shipped_quantity && item.damaged_quantity === 0) {
    item.condition = 'good';
  }
};

/**
 * Validate damaged quantity
 */
const validateDamagedQty = (index: number): void => {
  const item = formData.items[index];
  
  if (item.damaged_quantity > item.received_quantity) {
    item.damaged_quantity = item.received_quantity;
    toast.add({
      severity: 'warn',
      summary: 'Invalid Quantity',
      detail: 'Damaged quantity cannot exceed received quantity',
      life: 3000,
    });
  }
  
  // Auto-set condition based on damage
  if (item.damaged_quantity > 0) {
    item.condition = 'damaged';
  } else if (item.received_quantity === item.shipped_quantity) {
    item.condition = 'good';
  }
};

/**
 * Handle submit
 */
const handleSubmit = async (): Promise<void> => {
  if (!isFormValid.value) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please check all item quantities and conditions',
      life: 3000,
    });
    return;
  }

  try {
    submitting.value = true;
    emit('save', formData);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to complete receipt',
      life: 3000,
    });
  } finally {
    submitting.value = false;
  }
};

/**
 * Handle cancel
 */
const handleCancel = (): void => {
  emit('cancel');
};

/**
 * Initialize form with transfer items
 */
const initializeForm = (): void => {
  formData.items = (props.transfer.items || []).map((item) => ({
    transfer_item_id: item.id,
    product_name: item.inventory?.product?.product_name || 'N/A',
    sku: item.inventory?.product?.sku || 'N/A',
    product_image: item.inventory?.product?.image_url,
    shipped_quantity: item.approved_quantity || 0,
    received_quantity: item.approved_quantity || 0, // Default to shipped qty
    damaged_quantity: 0,
    condition: null,
    notes: '',
  }));
};

// Lifecycle hooks
onMounted(() => {
  initializeForm();
});
</script>

<style scoped>
.p-invalid {
  border-color: #ef4444 !important;
}

.p-error {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}
</style>
