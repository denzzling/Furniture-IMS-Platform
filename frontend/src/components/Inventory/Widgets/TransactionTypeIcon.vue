<!-- frontend/src/components/Inventory/Widgets/TransactionTypeIcon.vue -->

<template>
  <div class="flex items-center gap-2">
    <i :class="iconClass" :style="{ color: iconColor }"></i>
    <span class="font-medium">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  type: 'purchase' | 'sale' | 'return_to_supplier' | 'customer_return' | 
        'transfer_out' | 'transfer_in' | 'adjustment' | 'damage' | 
        'expired' | 'lost' | 'assembly' | 'sample' | 'writeoff';
}

const props = defineProps<Props>();

const iconMap: Record<string, { icon: string; color: string; label: string }> = {
  purchase: { icon: 'pi pi-shopping-cart', color: '#10b981', label: 'Purchase' },
  sale: { icon: 'pi pi-dollar', color: '#3b82f6', label: 'Sale' },
  return_to_supplier: { icon: 'pi pi-arrow-up', color: '#f59e0b', label: 'Return to Supplier' },
  customer_return: { icon: 'pi pi-arrow-down', color: '#8b5cf6', label: 'Customer Return' },
  transfer_out: { icon: 'pi pi-arrow-right', color: '#ef4444', label: 'Transfer Out' },
  transfer_in: { icon: 'pi pi-arrow-left', color: '#10b981', label: 'Transfer In' },
  adjustment: { icon: 'pi pi-sync', color: '#6366f1', label: 'Adjustment' },
  damage: { icon: 'pi pi-exclamation-triangle', color: '#ef4444', label: 'Damage' },
  expired: { icon: 'pi pi-clock', color: '#f59e0b', label: 'Expired' },
  lost: { icon: 'pi pi-times-circle', color: '#ef4444', label: 'Lost' },
  assembly: { icon: 'pi pi-wrench', color: '#6366f1', label: 'Assembly' },
  sample: { icon: 'pi pi-gift', color: '#8b5cf6', label: 'Sample' },
  writeoff: { icon: 'pi pi-trash', color: '#6b7280', label: 'Write-off' },
};

const iconClass = computed(() => iconMap[props.type]?.icon || 'pi pi-circle');
const iconColor = computed(() => iconMap[props.type]?.color || '#6b7280');
const label = computed(() => iconMap[props.type]?.label || props.type);
</script>