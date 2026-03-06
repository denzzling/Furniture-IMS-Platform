<!-- frontend/src/components/Inventory/Cards/InventoryCard.vue -->

<template>
  <Card class="inventory-card">
    <template #header>
      <div class="flex justify-between items-center p-4 pb-0">
        <div class="flex items-center gap-3">
          <Avatar 
            v-if="inventory.product?.image_url"
            :image="inventory.product.image_url" 
            size="large" 
            shape="square" 
          />
          <Avatar 
            v-else
            icon="pi pi-box" 
            size="large" 
            shape="square" 
            style="background-color: #dee2e6; color: #495057"
          />
          <div>
            <h3 class="text-lg font-semibold m-0">
              {{ inventory.product?.product_name || 'Unknown Product' }}
            </h3>
            <p class="text-sm text-gray-500 m-0">
              {{ inventory.product?.sku || 'N/A' }}
            </p>
          </div>
        </div>
        <StockStatusBadge :status="inventory.stock_status" />
      </div>
    </template>

    <template #content>
      <div class="grid grid-cols-2 gap-4">
        <!-- Quantity Info -->
        <div>
          <label class="text-xs text-gray-500 block mb-1">On Hand</label>
          <div class="text-2xl font-bold text-primary">
            {{ inventory.quantity_on_hand }}
          </div>
        </div>

        <div>
          <label class="text-xs text-gray-500 block mb-1">Available</label>
          <div class="text-2xl font-bold" :class="availabilityClass">
            {{ inventory.quantity_available }}
          </div>
        </div>

        <div>
          <label class="text-xs text-gray-500 block mb-1">Reserved</label>
          <div class="text-lg">{{ inventory.quantity_reserved }}</div>
        </div>

        <div>
          <label class="text-xs text-gray-500 block mb-1">Damaged</label>
          <div class="text-lg text-red-600">{{ inventory.quantity_damaged }}</div>
        </div>

        <!-- Reorder Info -->
        <div>
          <label class="text-xs text-gray-500 block mb-1">Reorder Point</label>
          <div class="text-lg">{{ inventory.reorder_point }}</div>
        </div>

        <div>
          <label class="text-xs text-gray-500 block mb-1">Safety Stock</label>
          <div class="text-lg">{{ inventory.safety_stock }}</div>
        </div>

        <!-- Value Info -->
        <div class="col-span-2">
          <label class="text-xs text-gray-500 block mb-1">Total Value</label>
          <div class="text-xl font-semibold text-green-600">
            ₱{{ formatCurrency(inventory.total_value || 0) }}
          </div>
        </div>

        <!-- Location -->
        <div class="col-span-2 pt-2 border-t">
          <LocationDisplay 
            :warehouse-section="inventory.warehouse_section"
            :aisle="inventory.aisle"
            :rack="inventory.rack"
            :shelf="inventory.shelf"
            :bin-code="inventory.bin_code"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2">
        <Button 
          v-if="canEdit"
          label="Edit" 
          icon="pi pi-pencil" 
          size="small"
          outlined
          @click="$emit('edit', inventory.id)"
        />
        <Button 
          label="View Details" 
          icon="pi pi-eye" 
          size="small"
          @click="$emit('view', inventory.id)"
        />
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import StockStatusBadge from '@/components/Inventory/Widgets/StockStatusBadge.vue';
import LocationDisplay from '@/components/Inventory/Widgets/LocationDisplay.vue';
import type { BranchInventory } from '@/types/inventory';

interface Props {
  inventory: BranchInventory;
  canEdit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: true,
});

defineEmits<{
  edit: [id: number];
  view: [id: number];
}>();

const availabilityClass = computed(() => {
  if (props.inventory.quantity_available === 0) {
    return 'text-red-600';
  }
  if (props.inventory.quantity_available <= props.inventory.reorder_point) {
    return 'text-orange-500';
  }
  return 'text-green-600';
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
</script>

<style scoped>
.inventory-card {
  @apply h-full;
}
</style>