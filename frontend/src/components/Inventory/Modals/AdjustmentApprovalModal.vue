<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :closable="!loading"
    :style="{ width: '60vw' }"
    @update:visible="handleClose"
  >
    <template #header>
      <h3 class="text-xl font-semibold">
        {{ isApproving ? 'Approve' : 'Reject' }} Stock Adjustment
      </h3>
    </template>

    <div v-if="adjustment">
      <!-- Adjustment Summary -->
      <Card class="mb-4 bg-gray-50">
        <template #content>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Adjustment #</label>
              <p class="font-semibold">{{ adjustment.adjustment_number }}</p>
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Type</label>
              <p class="font-medium">{{ getTypeLabel(adjustment.adjustment_type) }}</p>
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Branch</label>
              <p class="font-medium">{{ adjustment.branch?.name }}</p>
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Date</label>
              <p class="font-medium">{{ formatDate(adjustment.adjustment_date) }}</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Reason -->
      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">Reason for Adjustment</label>
        <p class="p-3 bg-gray-50 rounded border text-sm">{{ adjustment.reason }}</p>
      </div>

      <!-- Items Table -->
      <div class="mb-4">
        <h4 class="text-md font-semibold mb-3">Adjustment Items</h4>
        <DataTable :value="adjustment.items" striped-rows responsive-layout="scroll">
          <Column field="inventory.product.product_name" header="Product">
            <template #body="{ data }">
              <div>
                <div class="font-semibold">{{ data.inventory?.product?.product_name }}</div>
                <div class="text-xs text-gray-500">SKU: {{ data.inventory?.product?.sku }}</div>
              </div>
            </template>
          </Column>
          <Column field="system_quantity" header="System Qty" class="text-center">
            <template #body="{ data }">
              <span class="font-medium">{{ data.system_quantity }}</span>
            </template>
          </Column>
          <Column field="actual_quantity" header="Actual Qty" class="text-center">
            <template #body="{ data }">
              <span class="font-medium">{{ data.actual_quantity }}</span>
            </template>
          </Column>
          <Column field="difference" header="Difference" class="text-center">
            <template #body="{ data }">
              <span
                class="font-bold"
                :class="{
                  'text-green-600': data.difference > 0,
                  'text-red-600': data.difference < 0,
                  'text-gray-600': data.difference === 0
                }"
              >
                {{ data.difference > 0 ? '+' : '' }}{{ data.difference }}
              </span>
            </template>
          </Column>
          <Column header="Value Impact">
            <template #body="{ data }">
              <span
                class="font-semibold"
                :class="{
                  'text-green-600': data.difference > 0,
                  'text-red-600': data.difference < 0
                }"
              >
                {{ formatCurrency(data.difference * (data.unit_cost || 0)) }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Total Value Impact -->
      <Card class="mb-4" :class="totalValueImpact >= 0 ? 'bg-green-50' : 'bg-red-50'">
        <template #content>
          <div class="flex justify-between items-center">
            <span class="text-lg font-semibold">Total Value Impact:</span>
            <span
              class="text-2xl font-bold"
              :class="totalValueImpact >= 0 ? 'text-green-600' : 'text-red-600'"
            >
              {{ formatCurrency(totalValueImpact) }}
            </span>
          </div>
        </template>
      </Card>

      <!-- Approval/Rejection Notes -->
      <div class="mb-4">
        <label for="notes" class="block text-sm font-medium mb-2">
          {{ isApproving ? 'Approval Notes (Optional)' : 'Rejection Reason' }}
          <span v-if="!isApproving" class="text-red-500">*</span>
        </label>
        <Textarea
          id="notes"
          v-model="notes"
          rows="3"
          :placeholder="isApproving ? 'Any additional notes...' : 'Explain why this adjustment is being rejected...'"
          class="w-full"
          :class="{ 'p-invalid': !isApproving && !notes }"
        />
        <small v-if="!isApproving && !notes" class="p-error">
          Rejection reason is required
        </small>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          @click="handleClose"
          :disabled="loading"
        />
        <Button
          v-if="isApproving"
          label="Approve Adjustment"
          icon="pi pi-check"
          severity="success"
          @click="handleApprove"
          :loading="loading"
        />
        <Button
          v-else
          label="Reject Adjustment"
          icon="pi pi-times"
          severity="danger"
          @click="handleReject"
          :loading="loading"
          :disabled="!notes"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';

import type { StockAdjustment } from '../../../types/inventory';

/**
 * Props interface
 */
interface Props {
  visible: boolean;
  adjustment: StockAdjustment | null;
  mode?: 'approve' | 'reject';
}

/**
 * Emits interface
 */
interface Emits {
  (e: 'approve', notes: string): void;
  (e: 'reject', reason: string): void;
  (e: 'close'): void;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'approve',
});

const emit = defineEmits<Emits>();

// Refs
const loading = ref(false);
const notes = ref('');

// Computed
const isApproving = computed(() => props.mode === 'approve');

const totalValueImpact = computed(() => {
  if (!props.adjustment?.items) return 0;
  
  return props.adjustment.items.reduce((sum, item) => {
    return sum + (item.difference * (item.unit_cost || 0));
  }, 0);
});

/**
 * Get type label
 */
const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    physical_count: 'Physical Count',
    cycle_count: 'Cycle Count',
    damaged_goods: 'Damaged Goods',
    expired_goods: 'Expired Goods',
    found_goods: 'Found Goods',
    lost_goods: 'Lost Goods',
    return_to_supplier: 'Return to Supplier',
    write_off: 'Write-off',
    other: 'Other',
  };
  return labels[type] || type;
};

/**
 * Format date
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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
 * Handle approve
 */
const handleApprove = (): void => {
  loading.value = true;
  emit('approve', notes.value);
  // Loading state will be handled by parent
};

/**
 * Handle reject
 */
const handleReject = (): void => {
  if (!notes.value) return;
  
  loading.value = true;
  emit('reject', notes.value);
  // Loading state will be handled by parent
};

/**
 * Handle close
 */
const handleClose = (): void => {
  if (!loading.value) {
    notes.value = '';
    emit('close');
  }
};

// Watch visible prop to reset notes
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    notes.value = '';
    loading.value = false;
  }
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
