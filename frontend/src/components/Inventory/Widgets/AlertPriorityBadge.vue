<!-- frontend/src/components/Inventory/Widgets/AlertPriorityBadge.vue -->

<template>
  <Tag 
    :value="label" 
    :severity="severity"
    :icon="icon"
    rounded
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Tag from 'primevue/tag';

interface Props {
  alertType: 'low_stock' | 'out_of_stock' | 'overstock' | 'reorder_needed' | 'expired_soon';
}

const props = defineProps<Props>();

const severityMap: Record<string, string> = {
  low_stock: 'warning',
  out_of_stock: 'danger',
  overstock: 'info',
  reorder_needed: 'warning',
  expired_soon: 'danger',
};

const labelMap: Record<string, string> = {
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
  overstock: 'Overstock',
  reorder_needed: 'Reorder Needed',
  expired_soon: 'Expiring Soon',
};

const iconMap: Record<string, string> = {
  low_stock: 'pi pi-exclamation-triangle',
  out_of_stock: 'pi pi-times-circle',
  overstock: 'pi pi-arrow-up',
  reorder_needed: 'pi pi-shopping-cart',
  expired_soon: 'pi pi-clock',
};

const severity = computed(() => severityMap[props.alertType] || 'secondary');
const label = computed(() => labelMap[props.alertType] || props.alertType);
const icon = computed(() => iconMap[props.alertType]);
</script>