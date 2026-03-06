<template>
  <div class="inventory-form">
    <form @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Branch (only in create mode) -->
        <div v-if="mode === 'create'" class="col-span-2">
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

        <!-- Product -->
        <div class="col-span-2">
          <label for="product" class="block text-sm font-medium mb-2">
            Product <span class="text-red-500">*</span>
          </label>
          <Select
            id="product"
            v-model="formData.product_id"
            :options="productOptions"
            option-label="label"
            option-value="value"
            placeholder="Select product"
            filter
            class="w-full"
            :class="{ 'p-invalid': v$.product_id.$error }"
            @change="onProductChange"
          />
          <small v-if="v$.product_id.$error" class="p-error">
            {{ v$.product_id.$errors[0]?.$message }}
          </small>
        </div>

        <!-- Variation (if product has variations) -->
        <div v-if="variationOptions.length > 0" class="col-span-2">
          <label for="variation" class="block text-sm font-medium mb-2">
            Variation
          </label>
          <Select
            id="variation"
            v-model="formData.variation_id"
            :options="variationOptions"
            option-label="label"
            option-value="value"
            placeholder="Select variation (optional)"
            class="w-full"
            show-clear
          />
        </div>

        <!-- Location Fields -->
        <div class="col-span-2">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i class="pi pi-map-marker text-primary"></i>
            Storage Location
          </h3>
        </div>

        <!-- Warehouse Section -->
        <div>
          <label for="warehouse-section" class="block text-sm font-medium mb-2">
            Warehouse Section
          </label>
          <InputText
            id="warehouse-section"
            v-model="formData.warehouse_section"
            placeholder="e.g., A, B, Main"
            class="w-full"
          />
        </div>

        <!-- Aisle -->
        <div>
          <label for="aisle" class="block text-sm font-medium mb-2">
            Aisle
          </label>
          <InputText
            id="aisle"
            v-model="formData.aisle"
            placeholder="e.g., A1, B2"
            class="w-full"
          />
        </div>

        <!-- Rack -->
        <div>
          <label for="rack" class="block text-sm font-medium mb-2">
            Rack
          </label>
          <InputText
            id="rack"
            v-model="formData.rack"
            placeholder="e.g., R1, R2"
            class="w-full"
          />
        </div>

        <!-- Shelf -->
        <div>
          <label for="shelf" class="block text-sm font-medium mb-2">
            Shelf
          </label>
          <InputText
            id="shelf"
            v-model="formData.shelf"
            placeholder="e.g., S1, S2"
            class="w-full"
          />
        </div>

        <!-- Bin Code -->
        <div class="col-span-2">
          <label for="bin-code" class="block text-sm font-medium mb-2">
            Bin Code
          </label>
          <InputText
            id="bin-code"
            v-model="formData.bin_code"
            placeholder="e.g., A1-R1-S1"
            class="w-full"
          />
        </div>

        <!-- Stock Levels Section -->
        <div class="col-span-2">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i class="pi pi-chart-line text-primary"></i>
            Stock Level Settings
          </h3>
        </div>

        <!-- Reorder Point -->
        <div>
          <label for="reorder-point" class="block text-sm font-medium mb-2">
            Reorder Point <span class="text-red-500">*</span>
          </label>
          <InputNumber
            id="reorder-point"
            v-model="formData.reorder_point"
            placeholder="Minimum quantity before reorder"
            class="w-full"
            :min="0"
            :class="{ 'p-invalid': v$.reorder_point.$error }"
          />
          <small v-if="v$.reorder_point.$error" class="p-error">
            {{ v$.reorder_point.$errors[0]?.$message }}
          </small>
        </div>

        <!-- Reorder Quantity -->
        <div>
          <label for="reorder-quantity" class="block text-sm font-medium mb-2">
            Reorder Quantity <span class="text-red-500">*</span>
          </label>
          <InputNumber
            id="reorder-quantity"
            v-model="formData.reorder_quantity"
            placeholder="Quantity to order when reordering"
            class="w-full"
            :min="1"
            :class="{ 'p-invalid': v$.reorder_quantity.$error }"
          />
          <small v-if="v$.reorder_quantity.$error" class="p-error">
            {{ v$.reorder_quantity.$errors[0]?.$message }}
          </small>
        </div>

        <!-- Safety Stock -->
        <div>
          <label for="safety-stock" class="block text-sm font-medium mb-2">
            Safety Stock <span class="text-red-500">*</span>
          </label>
          <InputNumber
            id="safety-stock"
            v-model="formData.safety_stock"
            placeholder="Buffer stock level"
            class="w-full"
            :min="0"
            :class="{ 'p-invalid': v$.safety_stock.$error }"
          />
          <small v-if="v$.safety_stock.$error" class="p-error">
            {{ v$.safety_stock.$errors[0]?.$message }}
          </small>
        </div>

        <!-- Maximum Stock -->
        <div>
          <label for="maximum-stock" class="block text-sm font-medium mb-2">
            Maximum Stock
          </label>
          <InputNumber
            id="maximum-stock"
            v-model="formData.maximum_stock"
            placeholder="Maximum quantity to stock"
            class="w-full"
            :min="0"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 mt-6">
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
          :label="mode === 'create' ? 'Create Inventory' : 'Save Changes'"
          icon="pi pi-save"
          :loading="submitting"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useVuelidate } from '@vuelidate/core';
import { required, minValue } from '@vuelidate/validators';
import Select from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';

import type { BranchInventory } from '@/types/inventory';

/**
 * Props interface
 */
interface Props {
  modelValue?: BranchInventory;
  mode: 'create' | 'edit';
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
const branchOptions = ref<Array<{ label: string; value: number }>>([]);
const productOptions = ref<Array<{ label: string; value: number }>>([]);
const variationOptions = ref<Array<{ label: string; value: number }>>([]);

// Form data
const formData = reactive({
  branch_id: props.modelValue?.branch_id || null,
  product_id: props.modelValue?.product_id || null,
  variation_id: props.modelValue?.variation_id || null,
  warehouse_section: props.modelValue?.warehouse_section || '',
  aisle: props.modelValue?.aisle || '',
  rack: props.modelValue?.rack || '',
  shelf: props.modelValue?.shelf || '',
  bin_code: props.modelValue?.bin_code || '',
  reorder_point: props.modelValue?.reorder_point || 0,
  reorder_quantity: props.modelValue?.reorder_quantity || 0,
  safety_stock: props.modelValue?.safety_stock || 0,
  maximum_stock: props.modelValue?.maximum_stock || null,
});

// Validation rules
const rules = computed(() => ({
  branch_id: props.mode === 'create' ? { required } : {},
  product_id: { required },
  reorder_point: { required, minValue: minValue(0) },
  reorder_quantity: { required, minValue: minValue(1) },
  safety_stock: { required, minValue: minValue(0) },
}));

const v$ = useVuelidate(rules, formData);

/**
 * Handle product change - load variations if product has them
 */
const onProductChange = async (): Promise<void> => {
  formData.variation_id = null;
  variationOptions.value = [];
  
  // TODO: Fetch variations for selected product from API
  // const response = await productApi.getVariations(formData.product_id);
  // variationOptions.value = response.data.map(v => ({
  //   label: v.variation_name,
  //   value: v.id
  // }));
};

/**
 * Handle form submit
 */
const handleSubmit = async (): Promise<void> => {
  const isValid = await v$.value.$validate();
  
  if (!isValid) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fill in all required fields correctly',
      life: 3000,
    });
    return;
  }

  try {
    submitting.value = true;
    
    // Clean data - remove empty strings
    const submitData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    emit('save', submitData);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to save inventory',
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
 * Load branches (for create mode)
 */
const loadBranches = async (): Promise<void> => {
  // TODO: Fetch branches from API
  branchOptions.value = [
    { label: 'Main Branch', value: 1 },
    { label: 'Branch A', value: 2 },
    { label: 'Branch B', value: 3 },
  ];
};

/**
 * Load products
 */
const loadProducts = async (): Promise<void> => {
  // TODO: Fetch products from API
  productOptions.value = [
    { label: 'Product A - SKU001', value: 1 },
    { label: 'Product B - SKU002', value: 2 },
    { label: 'Product C - SKU003', value: 3 },
  ];
};

// Lifecycle hooks
onMounted(async () => {
  await loadBranches();
  await loadProducts();
  
  // Load variations if editing and product is selected
  if (props.mode === 'edit' && formData.product_id) {
    await onProductChange();
  }
});

// Watch modelValue for changes (edit mode)
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && props.mode === 'edit') {
      Object.assign(formData, {
        branch_id: newValue.branch_id,
        product_id: newValue.product_id,
        variation_id: newValue.variation_id,
        warehouse_section: newValue.warehouse_section || '',
        aisle: newValue.aisle || '',
        rack: newValue.rack || '',
        shelf: newValue.shelf || '',
        bin_code: newValue.bin_code || '',
        reorder_point: newValue.reorder_point,
        reorder_quantity: newValue.reorder_quantity,
        safety_stock: newValue.safety_stock,
        maximum_stock: newValue.maximum_stock,
      });
    }
  },
  { deep: true }
);
</script>

<style scoped>
/* Form styling */
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
