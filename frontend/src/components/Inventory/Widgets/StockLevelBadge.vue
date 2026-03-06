<!-- frontend/src/components/Inventory/Widgets/StockLevelBadge.vue -->

<template>
  <div class="flex items-center gap-2">
    <Tag 
      :value="displayValue" 
      :severity="severity"
      :icon="icon"
    />
    <span v-if="showReorderPoint" class="text-xs text-gray-500">
      (Reorder: {{ reorderPoint }})
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Tag from 'primevue/tag';

interface Props {
  currentQuantity: number;
  reorderPoint?: number;
  maximumStock?: number;
  showReorderPoint?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showReorderPoint: false,
});

const severity = computed(() => {
  if (props.currentQuantity === 0) {
    return 'danger';
  }
  
  if (props.reorderPoint && props.currentQuantity <= props.reorderPoint) {
    return 'warning';
  }
  
  if (props.maximumStock && props.currentQuantity > props.maximumStock) {
    return 'info';
  }
  
  return 'success';
});

const icon = computed(() => {
  if (props.currentQuantity === 0) {
    return 'pi pi-times-circle';
  }
  
  if (props.reorderPoint && props.currentQuantity <= props.reorderPoint) {
    return 'pi pi-exclamation-triangle';
  }
  
  if (props.maximumStock && props.currentQuantity > props.maximumStock) {
    return 'pi pi-arrow-up';
  }
  
  return 'pi pi-check-circle';
});

const displayValue = computed(() => {
  return `${props.currentQuantity} units`;
});
</script>