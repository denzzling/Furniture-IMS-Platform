<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :closable="!loading"
    :style="{ width: '50vw' }"
    @update:visible="handleClose"
  >
    <template #header>
      <h3 class="text-xl font-semibold">Acknowledge Stock Alert</h3>
    </template>

    <div v-if="alert">
      <!-- Alert Type Badge -->
      <div class="flex items-center gap-3 mb-4">
        <Tag
          :value="getAlertTypeLabel(alert.alert_type)"
          :severity="getAlertSeverity(alert.alert_type)"
          class="text-sm"
        />
        <Tag
          :value="alert.priority.toUpperCase()"
          :severity="getPrioritySeverity(alert.priority)"
          class="text-sm"
        />
        <span class="text-sm text-gray-500">
          Created {{ formatRelativeTime(alert.created_at) }}
        </span>
      </div>

      <!-- Product & Branch Info -->
      <Card class="mb-4 bg-gray-50">
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Product</label>
              <div class="font-semibold">{{ alert.inventory?.product?.product_name }}</div>
              <div class="text-xs text-gray-500">SKU: {{ alert.inventory?.product?.sku }}</div>
              <div v-if="alert.inventory?.variation" class="text-sm text-gray-600 mt-1">
                Variation: {{ alert.inventory?.variation?.variation_name }}
              </div>
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Branch</label>
              <div class="font-semibold">{{ alert.inventory?.branch?.name }}</div>
              <div class="text-xs text-gray-500">
                {{ alert.inventory?.branch?.address }}
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Current Inventory Status -->
      <div class="mb-4">
        <h4 class="text-md font-semibold mb-3">Current Inventory Status</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="p-3 bg-blue-50 rounded border border-blue-200">
            <label class="block text-xs text-blue-700 mb-1">On Hand</label>
            <p class="text-xl font-bold text-blue-900">{{ alert.inventory?.quantity_on_hand || 0 }}</p>
          </div>
          <div class="p-3 bg-green-50 rounded border border-green-200">
            <label class="block text-xs text-green-700 mb-1">Available</label>
            <p class="text-xl font-bold text-green-900">{{ alert.inventory?.quantity_available || 0 }}</p>
          </div>
          <div class="p-3 bg-orange-50 rounded border border-orange-200">
            <label class="block text-xs text-orange-700 mb-1">Reorder Point</label>
            <p class="text-xl font-bold text-orange-900">{{ alert.inventory?.reorder_point || 0 }}</p>
          </div>
          <div class="p-3 bg-purple-50 rounded border border-purple-200">
            <label class="block text-xs text-purple-700 mb-1">Safety Stock</label>
            <p class="text-xl font-bold text-purple-900">{{ alert.inventory?.safety_stock || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- Alert Message -->
      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">Alert Message</label>
        <Message :severity="getMessageSeverity(alert.alert_type)" :closable="false">
          {{ alert.message }}
        </Message>
      </div>

      <!-- Recommended Action -->
      <div v-if="alert.recommended_order_quantity" class="mb-4">
        <Card class="bg-yellow-50 border border-yellow-300">
          <template #content>
            <div class="flex items-start gap-3">
              <i class="pi pi-lightbulb text-2xl text-yellow-600"></i>
              <div>
                <h4 class="font-semibold text-yellow-900 mb-1">Recommended Action</h4>
                <p class="text-sm text-yellow-800">
                  Order <strong>{{ alert.recommended_order_quantity }}</strong> units to restore optimal stock levels
                </p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Acknowledgement Note -->
      <div class="mb-4">
        <label for="note" class="block text-sm font-medium mb-2">
          Acknowledgement Note <span class="text-gray-400">(Optional)</span>
        </label>
        <Textarea
          id="note"
          v-model="note"
          rows="3"
          placeholder="Add notes about actions taken or planned in response to this alert..."
          class="w-full"
        />
        <small class="text-gray-500">
          This note will be recorded in the alert history
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
          label="Acknowledge Alert"
          icon="pi pi-check"
          severity="info"
          @click="handleAcknowledge"
          :loading="loading"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';

import type { StockAlert } from '@/types/inventory';

/**
 * Props interface
 */
interface Props {
  visible: boolean;
  alert: StockAlert | null;
}

/**
 * Emits interface
 */
interface Emits {
  (e: 'acknowledge', note: string): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Refs
const loading = ref(false);
const note = ref('');

/**
 * Get alert type label
 */
const getAlertTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
    overstock: 'Overstock',
    reorder_point: 'Reorder Point Reached',
    expiring_soon: 'Expiring Soon',
  };
  return labels[type] || type;
};

/**
 * Get alert severity
 */
const getAlertSeverity = (type: string): 'danger' | 'warn' | 'info' => {
  const severities: Record<string, 'danger' | 'warn' | 'info'> = {
    out_of_stock: 'danger',
    low_stock: 'warn',
    reorder_point: 'warn',
    expiring_soon: 'warn',
    overstock: 'info',
  };
  return severities[type] || 'info';
};

/**
 * Get priority severity
 */
const getPrioritySeverity = (priority: string): 'danger' | 'warn' | 'info' => {
  const severities: Record<string, 'danger' | 'warn' | 'info'> = {
    high: 'danger',
    medium: 'warn',
    low: 'info',
  };
  return severities[priority] || 'info';
};

/**
 * Get message severity
 */
const getMessageSeverity = (type: string): 'error' | 'warn' | 'info' => {
  const severities: Record<string, 'error' | 'warn' | 'info'> = {
    out_of_stock: 'error',
    low_stock: 'warn',
    reorder_point: 'warn',
    expiring_soon: 'warn',
    overstock: 'info',
  };
  return severities[type] || 'info';
};

/**
 * Format relative time
 */
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Handle acknowledge
 */
const handleAcknowledge = (): void => {
  loading.value = true;
  emit('acknowledge', note.value);
};

/**
 * Handle close
 */
const handleClose = (): void => {
  if (!loading.value) {
    note.value = '';
    emit('close');
  }
};

// Watch visible prop to reset state
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    note.value = '';
    loading.value = false;
  }
});
</script>
