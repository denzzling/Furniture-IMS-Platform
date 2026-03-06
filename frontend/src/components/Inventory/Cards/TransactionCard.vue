<!-- frontend/src/components/Inventory/Cards/TransactionCard.vue -->

<template>
  <Card class="transaction-card">
    <template #content>
      <div class="flex items-start gap-3">
        <!-- Transaction Icon -->
        <div 
          class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          :style="{ backgroundColor: iconBgColor }"
        >
          <i :class="transactionIcon" :style="{ color: iconColor }"></i>
        </div>

        <!-- Transaction Details -->
        <div class="flex-1">
          <div class="flex justify-between items-start mb-2">
            <div>
              <div class="font-semibold">{{ transaction.transaction_number }}</div>
              <TransactionTypeIcon :type="transaction.transaction_type" class="mt-1" />
            </div>
            <div class="text-right">
              <div 
                class="text-xl font-bold"
                :class="quantityChangeClass"
              >
                {{ quantityChangeText }}
              </div>
              <div class="text-xs text-gray-500">
                {{ formatDate(transaction.transaction_date) }}
              </div>
            </div>
          </div>

          <!-- Product Info -->
          <div class="text-sm mb-2">
            <div class="font-medium">
              {{ transaction.product?.product_name || 'Unknown Product' }}
            </div>
            <div class="text-gray-500">
              {{ transaction.branch?.branch_name || 'Unknown Branch' }}
            </div>
          </div>

          <!-- Quantity Details -->
          <div class="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2 rounded">
            <div>
              <div class="text-gray-500">Before</div>
              <div class="font-semibold">{{ transaction.quantity_before }}</div>
            </div>
            <div>
              <div class="text-gray-500">Change</div>
              <div class="font-semibold" :class="quantityChangeClass">
                {{ quantityChangeText }}
              </div>
            </div>
            <div>
              <div class="text-gray-500">After</div>
              <div class="font-semibold">{{ transaction.quantity_after }}</div>
            </div>
          </div>

          <!-- Value & Notes -->
          <div v-if="transaction.total_value" class="mt-2 text-sm">
            <span class="text-gray-500">Value:</span>
            <span class="font-semibold ml-1 text-green-600">
              ₱{{ formatCurrency(transaction.total_value) }}
            </span>
          </div>

          <div v-if="transaction.notes" class="mt-2 text-sm text-gray-600 italic">
            {{ transaction.notes }}
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Card from 'primevue/card';
import TransactionTypeIcon from '.././Widgets/TransactionTypeIcon.vue';
import type { InventoryTransaction } from '../../../types/inventory';

interface Props {
  transaction: InventoryTransaction;
}

const props = defineProps<Props>();

const transactionIcon = computed(() => {
  const iconMap: Record<string, string> = {
    purchase: 'pi pi-shopping-cart',
    sale: 'pi pi-dollar',
    transfer_in: 'pi pi-arrow-left',
    transfer_out: 'pi pi-arrow-right',
    adjustment: 'pi pi-sync',
    damage: 'pi pi-exclamation-triangle',
  };
  return iconMap[props.transaction.transaction_type] || 'pi pi-circle';
});

const iconColor = computed(() => {
  const colorMap: Record<string, string> = {
    purchase: '#10b981',
    sale: '#3b82f6',
    transfer_in: '#10b981',
    transfer_out: '#ef4444',
    adjustment: '#6366f1',
    damage: '#ef4444',
  };
  return colorMap[props.transaction.transaction_type] || '#6b7280';
});

const iconBgColor = computed(() => {
  return `${iconColor.value}20`;
});

const quantityChangeClass = computed(() => {
  return props.transaction.quantity_change >= 0 ? 'text-green-600' : 'text-red-600';
});

const quantityChangeText = computed(() => {
  const change = props.transaction.quantity_change;
  return change >= 0 ? `+${change}` : `${change}`;
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
</script>

<style scoped>
.transaction-card {
  @apply h-full;
}
</style>