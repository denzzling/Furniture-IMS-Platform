<template>
  <div class="ship-form">
    <form @submit.prevent="handleSubmit">
      <!-- Transfer Summary (Read-only) -->
      <Card class="mb-4 bg-gray-50">
        <template #title>
          <span class="text-lg">Transfer Summary</span>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">Transfer Number</label>
              <p class="font-semibold text-lg">{{ transfer?.transfer_number }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">Total Items</label>
              <p class="font-semibold text-lg">{{ transfer?.total_items || 0 }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">From Branch</label>
              <p class="font-medium">{{ transfer?.from_branch?.name }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">To Branch</label>
              <p class="font-medium">{{ transfer?.to_branch?.name }}</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Shipment Information -->
      <Card class="mb-4">
        <template #title>
          <span class="text-lg">Shipment Details</span>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Vehicle Type -->
            <div>
              <label for="vehicle-type" class="block text-sm font-medium mb-2">
                Vehicle Type
              </label>
              <InputText
                id="vehicle-type"
                v-model="formData.vehicle_type"
                placeholder="e.g., Truck, Van, Motorcycle"
                class="w-full"
              />
            </div>

            <!-- Driver Name -->
            <div>
              <label for="driver-name" class="block text-sm font-medium mb-2">
                Driver Name <span class="text-red-500">*</span>
              </label>
              <InputText
                id="driver-name"
                v-model="formData.driver_name"
                placeholder="Full name of driver"
                class="w-full"
                :class="{ 'p-invalid': v$.driver_name.$error }"
              />
              <small v-if="v$.driver_name.$error" class="p-error">
                {{ v$.driver_name.$errors[0]?.$message }}
              </small>
            </div>

            <!-- Driver Contact -->
            <div>
              <label for="driver-contact" class="block text-sm font-medium mb-2">
                Driver Contact Number <span class="text-red-500">*</span>
              </label>
              <InputText
                id="driver-contact"
                v-model="formData.driver_contact"
                placeholder="e.g., +63 912 345 6789"
                class="w-full"
                :class="{ 'p-invalid': v$.driver_contact.$error }"
              />
              <small v-if="v$.driver_contact.$error" class="p-error">
                {{ v$.driver_contact.$errors[0]?.$message }}
              </small>
            </div>

            <!-- Tracking Number -->
            <div>
              <label for="tracking-number" class="block text-sm font-medium mb-2">
                Tracking Number
              </label>
              <InputText
                id="tracking-number"
                v-model="formData.tracking_number"
                placeholder="Optional tracking/waybill number"
                class="w-full"
              />
            </div>

            <!-- Notes -->
            <div class="col-span-2">
              <label for="notes" class="block text-sm font-medium mb-2">
                Shipping Notes
              </label>
              <Textarea
                id="notes"
                v-model="formData.notes"
                rows="3"
                placeholder="Any special instructions or notes..."
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Items to Ship (Read-only table) -->
      <Card class="mb-4">
        <template #title>
          <span class="text-lg">Items to Ship</span>
        </template>
        <template #content>
          <DataTable :value="transfer?.items" striped-rows>
            <Column field="inventory.product.product_name" header="Product">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <Avatar
                    v-if="data.inventory?.product?.image_url"
                    :image="data.inventory.product.image_url"
                    size="normal"
                    shape="square"
                  />
                  <div>
                    <div class="font-semibold">{{ data.inventory?.product?.product_name }}</div>
                    <div class="text-sm text-gray-500">SKU: {{ data.inventory?.product?.sku }}</div>
                  </div>
                </div>
              </template>
            </Column>
            <Column field="approved_quantity" header="Approved Quantity">
              <template #body="{ data }">
                <span class="font-semibold text-lg">{{ data.approved_quantity }}</span>
              </template>
            </Column>
            <Column field="unit_cost" header="Unit Cost">
              <template #body="{ data }">
                {{ formatCurrency(data.unit_cost || 0) }}
              </template>
            </Column>
            <Column header="Total Value">
              <template #body="{ data }">
                <span class="font-semibold">
                  {{ formatCurrency((data.approved_quantity || 0) * (data.unit_cost || 0)) }}
                </span>
              </template>
            </Column>
          </DataTable>
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
          label="Confirm Shipment"
          icon="pi pi-send"
          severity="success"
          :loading="submitting"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
// import { useVuelidate } from './vuelidate/core';
// import { required } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';


import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Avatar from 'primevue/avatar';

import type { StockTransfer } from '@/types/inventory';

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

// Form data
const formData = reactive({
  vehicle_type: '',
  driver_name: '',
  driver_contact: '',
  tracking_number: '',
  notes: '',
});

// Validation rules
const rules = {
  driver_name: { required },
  driver_contact: { required },
};

const v$ = useVuelidate(rules, formData);

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

  try {
    submitting.value = true;
    emit('save', formData);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to confirm shipment',
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
