<template>
  <div class="adjustment-form">
    <form @submit.prevent="handleSubmit">
      <!-- Basic Information -->
      <Card class="mb-4">
        <template #title>
          <span class="text-lg">Adjustment Information</span>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Branch -->
            <div>
              <label for="branch" class="block text-sm font-medium mb-2">
                Branch <span class="text-red-500">*</span>
              </label>
              <Select
                id="branch"
                v-model="formData.branch_id"
                :options="branchOptions"
                option-label="label"
                option-value="value"
                placeholder="Select branch"
                class="w-full"
                :class="{ 'p-invalid': v$.branch_id.$error }"
              />
              <small v-if="v$.branch_id.$error" class="p-error">
                {{ v$.branch_id.$errors[0]?.$message }}
              </small>
            </div>

            <!-- Adjustment Type -->
            <div>
              <label for="type" class="block text-sm font-medium mb-2">
                Adjustment Type <span class="text-red-500">*</span>
              </label>
              <Select
                id="type"
                v-model="formData.adjustment_type"
                :options="typeOptions"
                option-label="label"
                option-value="value"
                placeholder="Select type"
                class="w-full"
                :class="{ 'p-invalid': v$.adjustment_type.$error }"
              />
              <small v-if="v$.adjustment_type.$error" class="p-error">
                {{ v$.adjustment_type.$errors[0]?.$message }}
              </small>
            </div>

            <!-- Adjustment Date -->
            <div>
              <label for="date" class="block text-sm font-medium mb-2">
                Adjustment Date <span class="text-red-500">*</span>
              </label>
              <Calendar
                id="date"
                v-model="formData.adjustment_date"
                date-format="yy-mm-dd"
                placeholder="Select date"
                class="w-full"
                show-button-bar
                :class="{ 'p-invalid': v$.adjustment_date.$error }"
              />
              <small v-if="v$.adjustment_date.$error" class="p-error">
                {{ v$.adjustment_date.$errors[0]?.$message }}
              </small>
            </div>

            <!-- Reason -->
            <div class="col-span-2">
              <label for="reason" class="block text-sm font-medium mb-2">
                Reason <span class="text-red-500">*</span>
              </label>
              <Textarea
                id="reason"
                v-model="formData.reason"
                rows="3"
                placeholder="Explain the reason for this adjustment..."
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
            <span class="text-lg">Adjustment Items</span>
            <Button
              type="button"
              label="Add Item"
              icon="pi pi-plus"
              @click="addItem"
              size="small"
            />
          </div>
        </template>
        <template #content>
          <div v-if="formData.items.length === 0" class="text-center py-8 text-gray-500">
            <i class="pi pi-inbox text-4xl mb-2"></i>
            <p>No items added. Click "Add Item" to begin.</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(item, index) in formData.items"
              :key="index"
              class="border rounded-lg p-4 bg-gray-50"
            >
              <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <!-- Product -->
                <div class="md:col-span-4">
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

                <!-- System Quantity (read-only) -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium mb-2">System Qty</label>
                  <InputNumber
                    v-model="item.system_quantity"
                    class="w-full"
                    :disabled="true"
                  />
                </div>

                <!-- Actual Quantity -->
                <div class="md:col-span-2">
                  <label :for="`actual-${index}`" class="block text-sm font-medium mb-2">
                    Actual Qty <span class="text-red-500">*</span>
                  </label>
                  <InputNumber
                    :id="`actual-${index}`"
                    v-model="item.actual_quantity"
                    class="w-full"
                    :min="0"
                    @input="calculateDifference(index)"
                  />
                </div>

                <!-- Difference (computed) -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium mb-2">Difference</label>
                  <InputNumber
                    :model-value="item.difference"
                    class="w-full"
                    :disabled="true"
                    :class="{
                      'text-green-600': item.difference > 0,
                      'text-red-600': item.difference < 0
                    }"
                  />
                </div>

                <!-- Notes -->
                <div class="md:col-span-2 flex items-end">
                  <InputText
                    v-model="item.notes"
                    placeholder="Notes (optional)"
                    class="w-full"
                  />
                </div>

                <!-- Remove Button -->
                <div class="md:col-span-12 md:col-span-1 flex items-end">
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

          <!-- Total Value Difference -->
          <div v-if="formData.items.length > 0" class="mt-6 pt-4 border-t">
            <div class="flex justify-end items-center gap-4">
              <span class="text-lg font-medium">Total Value Difference:</span>
              <span
                class="text-2xl font-bold"
                :class="{
                  'text-green-600': totalValueDifference > 0,
                  'text-red-600': totalValueDifference < 0,
                  'text-gray-600': totalValueDifference === 0
                }"
              >
                {{ formatCurrency(totalValueDifference) }}
              </span>
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
          type="button"
          label="Save as Draft"
          icon="pi pi-save"
          severity="secondary"
          @click="handleSave('draft')"
          :loading="submitting && saveAction === 'draft'"
          :disabled="formData.items.length === 0"
        />
        <Button
          type="submit"
          label="Submit for Approval"
          icon="pi pi-send"
          :loading="submitting && saveAction === 'submit'"
          :disabled="formData.items.length === 0"
        />
      </div>
    </form>

    <!-- Product Picker Dialog -->
    <Dialog
      v-model:visible="showProductPicker"
      header="Select Inventory Item"
      :modal="true"
      :style="{ width: '50vw' }"
    >
      <DataTable
        :value="inventoryOptions"
        selection-mode="single"
        @row-select="onProductSelect"
        :paginator="true"
        :rows="10"
        filter-display="row"
        v-model:filters="productFilters"
      >
        <Column field="label" header="Product" sortable :show-filter-menu="false">
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              type="text"
              @input="filterCallback()"
              class="p-column-filter"
              placeholder="Search..."
            />
          </template>
        </Column>
        <Column field="currentQty" header="Current Qty" sortable />
      </DataTable>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
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
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { FilterMatchMode } from '@primevue/core/api';

import type { StockAdjustmentItem } from '@/types/inventory';

/**
 * Emits interface
 */
interface Emits {
  (e: 'save', data: any, action: 'draft' | 'submit'): void;
  (e: 'cancel'): void;
}

const emit = defineEmits<Emits>();

// Composables
const toast = useToast();

// Refs
const submitting = ref(false);
const saveAction = ref<'draft' | 'submit'>('draft');
const showProductPicker = ref(false);
const currentItemIndex = ref<number | null>(null);

const branchOptions = ref<Array<{ label: string; value: number }>>([]);
const inventoryOptions = ref<Array<{ label: string; value: number; currentQty: number; unitCost: number }>>([]);

const productFilters = ref({
  label: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

// Type options
const typeOptions = [
  { label: 'Physical Count', value: 'physical_count' },
  { label: 'Cycle Count', value: 'cycle_count' },
  { label: 'Damaged Goods', value: 'damaged_goods' },
  { label: 'Expired Goods', value: 'expired_goods' },
  { label: 'Found Goods', value: 'found_goods' },
  { label: 'Lost Goods', value: 'lost_goods' },
  { label: 'Return to Supplier', value: 'return_to_supplier' },
  { label: 'Write-off', value: 'write_off' },
  { label: 'Other', value: 'other' },
];

// Form data
const formData = reactive({
  branch_id: null as number | null,
  adjustment_type: null as string | null,
  adjustment_date: new Date(),
  reason: '',
  items: [] as Array<{
    inventory_id: number | null;
    system_quantity: number;
    actual_quantity: number;
    difference: number;
    unit_cost: number;
    notes: string;
  }>,
});

// Validation rules
const rules = {
  branch_id: { required },
  adjustment_type: { required },
  adjustment_date: { required },
  reason: { required },
};

const v$ = useVuelidate(rules, formData);

/**
 * Computed total value difference
 */
const totalValueDifference = computed(() => {
  return formData.items.reduce((sum, item) => {
    return sum + (item.difference * item.unit_cost);
  }, 0);
});

/**
 * Add new item
 */
const addItem = (): void => {
  formData.items.push({
    inventory_id: null,
    system_quantity: 0,
    actual_quantity: 0,
    difference: 0,
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
 * Handle inventory selection
 */
const onInventoryChange = (index: number): void => {
  const item = formData.items[index];
  const inventory = inventoryOptions.value.find((inv) => inv.value === item.inventory_id);
  
  if (inventory) {
    item.system_quantity = inventory.currentQty;
    item.unit_cost = inventory.unitCost;
    calculateDifference(index);
  }
};

/**
 * Calculate difference for item
 */
const calculateDifference = (index: number): void => {
  const item = formData.items[index];
  item.difference = item.actual_quantity - item.system_quantity;
};

/**
 * Handle product selection from dialog
 */
const onProductSelect = (event: any): void => {
  if (currentItemIndex.value !== null) {
    formData.items[currentItemIndex.value].inventory_id = event.data.value;
    onInventoryChange(currentItemIndex.value);
  }
  showProductPicker.value = false;
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
 * Handle save
 */
const handleSave = async (action: 'draft' | 'submit'): Promise<void> => {
  saveAction.value = action;
  
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

  if (formData.items.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'No Items',
      detail: 'Please add at least one item',
      life: 3000,
    });
    return;
  }

  try {
    submitting.value = true;
    emit('save', formData, action);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to save adjustment',
      life: 3000,
    });
  } finally {
    submitting.value = false;
  }
};

/**
 * Handle submit (submit for approval)
 */
const handleSubmit = async (): Promise<void> => {
  await handleSave('submit');
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
    { label: 'Main Branch', value: 1 },
    { label: 'Branch A', value: 2 },
  ];
};

/**
 * Load inventory items for selected branch
 */
const loadInventory = async (): Promise<void> => {
  // TODO: Fetch from API based on selected branch
  inventoryOptions.value = [
    { label: 'Product A - SKU001', value: 1, currentQty: 100, unitCost: 500 },
    { label: 'Product B - SKU002', value: 2, currentQty: 50, unitCost: 750 },
  ];
};

// Lifecycle hooks
onMounted(async () => {
  await loadBranches();
  await loadInventory();
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
