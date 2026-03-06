<!-- frontend/src/components/Inventory/Widgets/StockStatusBadge.vue -->

<template>
  <Tag 
    :value="label" 
    :severity="severity"
    :icon="icon"
    :rounded="rounded"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Tag from 'primevue/tag';

interface Props {
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued' | 'on_order';
  rounded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  rounded: true,
});

const severityMap: Record<string, string> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'danger',
  discontinued: 'secondary',
  on_order: 'info',
};

const labelMap: Record<string, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
  discontinued: 'Discontinued',
  on_order: 'On Order',
};

const iconMap: Record<string, string> = {
  in_stock: 'pi pi-check-circle',
  low_stock: 'pi pi-exclamation-triangle',
  out_of_stock: 'pi pi-times-circle',
  discontinued: 'pi pi-ban',
  on_order: 'pi pi-clock',
};

const severity = computed(() => severityMap[props.status] || 'secondary');
const label = computed(() => labelMap[props.status] || props.status);
const icon = computed(() => iconMap[props.status]);
</script>