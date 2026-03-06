<template>
  <div class="transfer-form">
    <form @submit.prevent="handleSubmit">
      <!-- Basic Information -->
      <Card class="mb-4">
        <template #title>
          <span class="text-lg">Transfer Information</span>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- From Branch -->
            <div>
              <label for="from-branch" class="block text-sm font-medium mb-2">
                From Branch <span class="text-red-500">*</span>
              </label>
              <Select
                id="from-branch"
                v-model="formData.from_branch_id"
                :options="branchOptions"
                option-label="label"
                option-value="value"
                placeholder="Select source branch"
                class="w-full"
                :class="{ 'p-invalid': v$.from_branch_id.$error }"
                @change="onFromBranchChange"
              />
              <small v-if="v$.from_branch_id.$error" class="p-error">
                {{ v$.from_branch_id.$errors[0]?.$message }}
              </small>
            </div>

            <!-- To Branch -->
            <div>
              <label for="to-branch" class="block text-sm font-medium mb-2">
                To Branch <span class="text-red-500">*</span>
              </label>
              <Select
                id="to-branch"
                v-model="formData.to_branch_id"
                :options="toBranchOptions"
                option-label="label"
                option-value="value"
                placeholder="Select destination branch"
                class="w-full"
                :class="{ 'p-invalid': v$.to_branch_id.$error }"
              />
              <small v-if="v$.to_branch_id.$error" class="p-error">
                {{ v$.to_branch_id.$errors[0]?.$message }}
              </small>
            </div>

            <!-- Expected Delivery Date -->
            <div>
              <label for="delivery-date" class="block text-sm font-medium mb-2">
                Expected Delivery Date <span class="text-red-500">*</span>
              </label>
              <Calendar
                id="delivery-date"
                v-model="formData.expected_delivery_date"
                date-format="yy-mm-dd"
                :min-date="minDeliveryDate"
                placeholder="Select expected delivery"
                class="w-full"
                show-button-bar
                :class="{ 'p-invalid': v$.expected_delivery_date.$error }"
              />
              <small v-if="v$.expected_delivery_date.$error" class="p-error">
                {{ v$.expected_delivery_date.$errors[0]?.$message }}
              </small>
            </div>

            <!-- Reason -->
            <div class="col-span-2">
              <label for="reason" class="block text-sm font-medium mb-2">
                Reason for Transfer <span class="text-red-500">*</span>
              </label>
              <Textarea
                id="reason"
                v-model="formData.reason"
                rows="3"
                placeholder="Explain the reason for this transfer..."
                class="w-full"
                :class="{ 'p-invalid': v$.reason.$error }"
              />
              <small v-if="v$.reason.$error" class="p-error">
                {{ v$.reason.$errors[0]?.$message }}
              </small>
            </div>
          </div>
        </template>
      </Card>

      <!-- Items Section -->
      <Card class="mb-4">
        <template #title>
          <div class="flex justify-between items-center">
            <span class="text-lg">Transfer Items</span>
            <Button
              type="button"
              label="Add Item"
              icon="pi pi-plus"
              @click="addItem"
              size="small"
              :disabled="!formData.from_branch_id"
            />
          </div>
        </template>
        <template #content>
          <div v-if="formData.items.length === 0" class="text-center py-8 text-gray-500">
            <i class="pi pi-inbox text-4xl mb-2"></i>
            <p>No items added. Click "Add Item" to begin.</p>
            <small v-if="!formData.from_branch_id" class="text-orange-500">
              Please select "From Branch" first
            </small>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(item, index) in formData.items"
              :key="index"
              class="border rounded-lg p-4 bg-gray-50"
            >
              <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <!-- Product -->
                <div class="md:col-span-5">
                  <label :for="`product-${index}`" class="block text-sm font-medium mb-2">
                    Product <span class="text-red-500">*</span>
                  </label>
                  <Select
                    :id="`product-${index}`"
                    v-model="item.inventory_id"
                    :options="inventoryOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Select product"
                    filter
                    class="w-full"
                    @change="onInventoryChange(index)"
                  />
                </div>

                <!-- Available Quantity (read-only) -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium mb-2">Available Qty</label>
                  <InputNumber
                    v-model="item.available_quantity"
                    class="w-full"
                    :disabled="true"
                  />
                </div>

                <!-- Requested Quantity -->
                <div class="md:col-span-2">
                  <label :for="`requested-${index}`" class="block text-sm font-medium mb-2">
                    Requested Qty <span class="text-red-500">*</span>
                  </label>
                  <InputNumber
                    :id="`requested-${index}`"
                    v-model="item.requested_quantity"
                    class="w-full"
                    :min="1"
                    :max="item.available_quantity"
                    :class="{ 'p-invalid': item.requested_quantity > item.available_quantity }"
                  />
                  <small v-if="item.requested_quantity > item.available_quantity" class="p-error">
                    Exceeds available quantity
                  </small>
                </div>

                <!-- Notes -->
                <div class="md:col-span-2">
                  <label :for="`notes-${index}`" class="block text-sm font-medium mb-2">Notes</label>
                  <InputText
                    :id="`notes-${index}`"
                    v-model="item.notes"
                    placeholder="Optional notes"
                    class="w-full"
                  />
                </div>

                <!-- Remove Button -->
                <div class="md:col-span-1 flex items-end">
                  <Button
                    type="button"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    @click="removeItem(index)"
                    aria-label="Remove item"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Calculated Fields -->
      <Card v-if="formData.items.length > 0" class="mb-4 bg-blue-50 border-blue-200">
        <template #title>
          <span class="text-lg">Transfer Summary</span>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Distance -->
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-1">Estimated Distance</div>
              <div class="text-2xl font-bold text-blue-600">
                {{ estimatedDistance }} km
              </div>
            </div>

            <!-- Transfer Cost -->
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-1">Estimated Transfer Cost</div>
              <div class="text-2xl font-bold text-orange-600">
                {{ formatCurrency(estimatedTransferCost) }}
              </div>
            </div>

            <!-- Total Goods Value -->
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-1">Total Goods Value</div>
              <div class="text-2xl font-bold text-green-600">
                {{ formatCurrency(totalGoodsValue) }}
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
          label="Create Transfer Request"
          icon="pi pi-send"
          :loading="submitting"
          :disabled="formData.items.length === 0 || !isFormValid"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import Card from 'primevue/card';
import Select from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Textarea from 'primevue/textarea';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';

/**
 * Emits interface
 */
interface Emits {
  (e: 'save', data: any): void;
  (e: 'cancel'): void;
}

const emit = defineEmits<Emits>();

// Composables
const toast = useToast();

// Refs
const submitting = ref(false);
const branchOptions = ref<Array<{ label: string; value: number; location?: { lat: number; lng: number } }>>([]);
const inventoryOptions = ref<Array<{ label: string; value: number; availableQty: number; unitCost: number }>>([]);

// Minimum delivery date (tomorrow)
const minDeliveryDate = computed(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
});

// Form data
const formData = reactive({
  from_branch_id: null as number | null,
  to_branch_id: null as number | null,
  expected_delivery_date: null as Date | null,
  reason: '',
  items: [] as Array<{
    inventory_id: number | null;
    available_quantity: number;
    requested_quantity: number;
    unit_cost: number;
    notes: string;
  }>,
});

// Validation rules
const rules = {
  from_branch_id: { required },
  to_branch_id: { required },
  expected_delivery_date: { required },
  reason: { required },
};

const v$ = useVuelidate(rules, formData);

/**
 * To branch options (exclude selected from branch)
 */
const toBranchOptions = computed(() => {
  return branchOptions.value.filter((branch) => branch.value !== formData.from_branch_id);
});

/**
 * Estimated distance between branches (km)
 */
const estimatedDistance = computed(() => {
  if (!formData.from_branch_id || !formData.to_branch_id) return 0;
  
  // TODO: Calculate actual distance using lat/lng
  // For now, return a mock value
  return Math.floor(Math.random() * 50) + 10;
});

/**
 * Estimated transfer cost
 */
const estimatedTransferCost = computed(() => {
  const baseCost = 500; // Base cost in PHP
  const costPerKm = 20; // PHP per km
  const costPerItem = 50; // PHP per item
  
  return baseCost + (estimatedDistance.value * costPerKm) + (formData.items.length * costPerItem);
});

/**
 * Total goods value
 */
const totalGoodsValue = computed(() => {
  return formData.items.reduce((sum, item) => {
    return sum + (item.requested_quantity * item.unit_cost);
  }, 0);
});

/**
 * Check if form is valid
 */
const isFormValid = computed(() => {
  return formData.items.every((item) => {
    return item.inventory_id && item.requested_quantity > 0 && item.requested_quantity <= item.available_quantity;
  });
});

/**
 * Add new item
 */
const addItem = (): void => {
  formData.items.push({
    inventory_id: null,
    available_quantity: 0,
    requested_quantity: 0,
    unit_cost: 0,
    notes: '',
  });
};

/**
 * Remove item
 */
const removeItem = (index: number): void => {
  formData.items.splice(index, 1);
};

/**
 * Handle from branch change
 */
const onFromBranchChange = async (): Promise<void> => {
  // Reset items when branch changes
  formData.items = [];
  formData.to_branch_id = null;
  
  // Load inventory for selected branch
  await loadInventory();
};

/**
 * Handle inventory selection
 */
const onInventoryChange = (index: number): void => {
  const item = formData.items[index];
  const inventory = inventoryOptions.value.find((inv) => inv.value === item.inventory_id);
  
  if (inventory) {
    item.available_quantity = inventory.availableQty;
    item.unit_cost = inventory.unitCost;
    item.requested_quantity = 0;
  }
};

/**
 * Format currency
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value);
};

/**
 * Handle submit
 */
const handleSubmit = async (): Promise<void> => {
  const isValid = await v$.value.$validate();
  
  if (!isValid) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fill in all required fields',
      life: 3000,
    });
    return;
  }

  if (!isFormValid.value) {
    toast.add({
      severity: 'warn',
      summary: 'Invalid Items',
      detail: 'Please check item quantities',
      life: 3000,
    });
    return;
  }

  try {
    submitting.value = true;
    
    const submitData = {
      ...formData,
      estimated_distance: estimatedDistance.value,
      estimated_transfer_cost: estimatedTransferCost.value,
      total_goods_value: totalGoodsValue.value,
    };
    
    emit('save', submitData);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to create transfer',
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
 * Load branches
 */
const loadBranches = async (): Promise<void> => {
  // TODO: Fetch from API
  branchOptions.value = [
    { label: 'Main Branch', value: 1, location: { lat: 14.5995, lng: 120.9842 } },
    { label: 'Branch A', value: 2, location: { lat: 14.6091, lng: 121.0223 } },
    { label: 'Branch B', value: 3, location: { lat: 14.5547, lng: 121.0244 } },
  ];
};

/**
 * Load inventory items for selected from branch
 */
const loadInventory = async (): Promise<void> => {
  if (!formData.from_branch_id) return;
  
  // TODO: Fetch from API based on selected branch
  inventoryOptions.value = [
    { label: 'Product A - SKU001', value: 1, availableQty: 100, unitCost: 500 },
    { label: 'Product B - SKU002', value: 2, availableQty: 50, unitCost: 750 },
    { label: 'Product C - SKU003', value: 3, availableQty: 75, unitCost: 1200 },
  ];
};

// Lifecycle hooks
onMounted(async () => {
  await loadBranches();
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
