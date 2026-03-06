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
        {{ mode === 'approve' ? 'Approve' : 'Reject' }} Stock Transfer
      </h3>
    </template>

    <div v-if="transfer">
      <!-- Transfer Summary -->
      <Card class="mb-4 bg-gray-50">
        <template #content>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Transfer #</label>
              <p class="font-semibold">{{ transfer.transfer_number }}</p>
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">From Branch</label>
              <p class="font-medium">{{ transfer.from_branch?.name }}</p>
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">To Branch</label>
              <p class="font-medium">{{ transfer.to_branch?.name }}</p>
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Expected Delivery</label>
              <p class="font-medium">{{ formatDate(transfer.expected_delivery_date) }}</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Reason -->
      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">Transfer Reason</label>
        <p class="p-3 bg-gray-50 rounded border text-sm">{{ transfer.reason }}</p>
      </div>

      <!-- Items Table with Stock Availability -->
      <div class="mb-4">
        <h4 class="text-md font-semibold mb-3">Transfer Items</h4>
        <DataTable :value="transfer.items" striped-rows responsive-layout="scroll">
          <Column field="inventory.product.product_name" header="Product">
            <template #body="{ data }">
              <div>
                <div class="font-semibold">{{ data.inventory?.product?.product_name }}</div>
                <div class="text-xs text-gray-500">SKU: {{ data.inventory?.product?.sku }}</div>
              </div>
            </template>
          </Column>
          <Column field="requested_quantity" header="Requested Qty" class="text-center">
            <template #body="{ data }">
              <span class="font-medium">{{ data.requested_quantity }}</span>
            </template>
          </Column>
          <Column header="Available Stock" class="text-center">
            <template #body="{ data }">
              <span
                class="font-semibold"
                :class="{
                  'text-green-600': data.inventory?.quantity_available >= data.requested_quantity,
                  'text-red-600': data.inventory?.quantity_available < data.requested_quantity
                }"
              >
                {{ data.inventory?.quantity_available || 0 }}
              </span>
            </template>
          </Column>
          <Column header="Status" class="text-center">
            <template #body="{ data }">
              <Tag
                v-if="data.inventory?.quantity_available >= data.requested_quantity"
                value="Available"
                severity="success"
              />
              <Tag
                v-else
                value="Insufficient"
                severity="danger"
              />
            </template>
          </Column>
          <Column header="Unit Value">
            <template #body="{ data }">
              {{ formatCurrency(data.unit_cost || 0) }}
            </template>
          </Column>
          <Column header="Total Value">
            <template #body="{ data }">
              <span class="font-semibold">
                {{ formatCurrency((data.requested_quantity || 0) * (data.unit_cost || 0)) }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Warnings if insufficient stock -->
      <Message v-if="hasInsufficientStock" severity="warn" :closable="false" class="mb-4">
        <strong>Warning:</strong> Some items have insufficient stock. Approval may require stock adjustment.
      </Message>

      <!-- Transfer Costs -->
      <Card class="mb-4 bg-blue-50">
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="text-center">
              <label class="block text-sm text-gray-600 mb-1">Total Goods Value</label>
              <p class="text-2xl font-bold text-green-600">
                {{ formatCurrency(transfer.total_goods_value || 0) }}
              </p>
            </div>
            <div class="text-center">
              <label class="block text-sm text-gray-600 mb-1">Estimated Transfer Cost</label>
              <p class="text-2xl font-bold text-orange-600">
                {{ formatCurrency(transfer.transfer_cost || 0) }}
              </p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Approval/Rejection Notes -->
      <div v-if="mode === 'reject'" class="mb-4">
        <label for="reason" class="block text-sm font-medium mb-2">
          Rejection Reason <span class="text-red-500">*</span>
        </label>
        <Textarea
          id="reason"
          v-model="rejectionReason"
          rows="3"
          placeholder="Explain why this transfer is being rejected..."
          class="w-full"
          :class="{ 'p-invalid': !rejectionReason }"
        />
        <small v-if="!rejectionReason" class="p-error">
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
          v-if="mode === 'approve'"
          label="Approve Transfer"
          icon="pi pi-check"
          severity="success"
          @click="handleApprove"
          :loading="loading"
        />
        <Button
          v-else
          label="Reject Transfer"
          icon="pi pi-times"
          severity="danger"
          @click="handleReject"
          :loading="loading"
          :disabled="!rejectionReason"
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
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';

import type { StockTransfer } from '@/types/inventory';

/**
 * Props interface
 */
interface Props {
  visible: boolean;
  transfer: StockTransfer | null;
  mode?: 'approve' | 'reject';
}

/**
 * Emits interface
 */
interface Emits {
  (e: 'approve'): void;
  (e: 'reject', reason: string): void;
  (e: 'close'): void;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'approve',
});

const emit = defineEmits<Emits>();

// Refs
const loading = ref(false);
const rejectionReason = ref('');

// Computed
const hasInsufficientStock = computed(() => {
  if (!props.transfer?.items) return false;
  
  return props.transfer.items.some((item) => {
    return (item.inventory?.quantity_available || 0) < item.requested_quantity;
  });
});

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
  emit('approve');
};

/**
 * Handle reject
 */
const handleReject = (): void => {
  if (!rejectionReason.value) return;
  
  loading.value = true;
  emit('reject', rejectionReason.value);
};

/**
 * Handle close
 */
const handleClose = (): void => {
  if (!loading.value) {
    rejectionReason.value = '';
    emit('close');
  }
};

// Watch visible prop to reset state
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    rejectionReason.value = '';
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
