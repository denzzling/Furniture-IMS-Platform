<!-- frontend/src/components/Inventory/Cards/AlertCard.vue -->

<template>
  <Card 
    class="alert-card cursor-pointer hover:shadow-lg transition-shadow"
    @click="$emit('click', alert.id)"
  >
    <template #content>
      <div class="flex items-start gap-3">
        <!-- Alert Icon -->
        <div 
          class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          :style="{ backgroundColor: iconBgColor }"
        >
          <i :class="alertIcon" class="text-xl" :style="{ color: iconColor }"></i>
        </div>

        <!-- Alert Content -->
        <div class="flex-1">
          <div class="flex justify-between items-start mb-2">
            <div>
              <AlertPriorityBadge :alert-type="alert.alert_type" />
              <h4 class="text-base font-semibold mt-2 mb-1">
                {{ alert.product?.product_name || 'Unknown Product' }}
              </h4>
              <p class="text-sm text-gray-500">
                {{ alert.branch?.branch_name || 'Unknown Branch' }}
              </p>
            </div>
          </div>

          <!-- Alert Details -->
          <div class="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div>
              <span class="text-gray-500">Current:</span>
              <span class="font-semibold ml-1">{{ alert.current_quantity }}</span>
            </div>
            <div v-if="alert.reorder_point">
              <span class="text-gray-500">Reorder:</span>
              <span class="font-semibold ml-1">{{ alert.reorder_point }}</span>
            </div>
            <div v-if="alert.recommended_order_quantity" class="col-span-2">
              <span class="text-gray-500">Recommended Order:</span>
              <span class="font-semibold ml-1 text-primary">
                {{ alert.recommended_order_quantity }} units
              </span>
            </div>
          </div>

          <!-- Status & Actions -->
          <div class="flex justify-between items-center mt-4 pt-3 border-t">
            <Tag 
              :value="statusLabel" 
              :severity="statusSeverity"
              rounded
            />
            
            <div class="flex gap-2">
              <Button 
                v-if="canAcknowledge && alert.status === 'active'"
                label="Acknowledge" 
                icon="pi pi-check" 
                size="small"
                outlined
                @click.stop="$emit('acknowledge', alert.id)"
              />
              <Button 
                v-if="canResolve && alert.status === 'acknowledged'"
                label="Resolve" 
                icon="pi pi-check-circle" 
                size="small"
                @click.stop="$emit('resolve', alert.id)"
              />
            </div>
          </div>

          <!-- Timestamp -->
          <div class="text-xs text-gray-400 mt-2">
            Created {{ formatRelativeTime(alert.created_at) }}
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import AlertPriorityBadge from '.././Widgets/AlertPriorityBadge.vue';
import type { StockAlert } from '../../../types/inventory';

interface Props {
  alert: StockAlert;
  canAcknowledge?: boolean;
  canResolve?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  canAcknowledge: true,
  canResolve: true,
});

defineEmits<{
  click: [id: number];
  acknowledge: [id: number];
  resolve: [id: number];
}>();

const alertIcon = computed(() => {
  const iconMap: Record<string, string> = {
    low_stock: 'pi pi-exclamation-triangle',
    out_of_stock: 'pi pi-times-circle',
    overstock: 'pi pi-arrow-up',
    reorder_needed: 'pi pi-shopping-cart',
    expired_soon: 'pi pi-clock',
  };
  return iconMap[props.alert.alert_type] || 'pi pi-info-circle';
});

const iconColor = computed(() => {
  const colorMap: Record<string, string> = {
    low_stock: '#f59e0b',
    out_of_stock: '#ef4444',
    overstock: '#3b82f6',
    reorder_needed: '#f59e0b',
    expired_soon: '#ef4444',
  };
  return colorMap[props.alert.alert_type] || '#6b7280';
});

const iconBgColor = computed(() => {
  const bgMap: Record<string, string> = {
    low_stock: 'rgba(245, 158, 11, 0.1)',
    out_of_stock: 'rgba(239, 68, 68, 0.1)',
    overstock: 'rgba(59, 130, 246, 0.1)',
    reorder_needed: 'rgba(245, 158, 11, 0.1)',
    expired_soon: 'rgba(239, 68, 68, 0.1)',
  };
  return bgMap[props.alert.alert_type] || 'rgba(107, 114, 128, 0.1)';
});

const statusSeverity = computed(() => {
  const severityMap: Record<string, string> = {
    active: 'danger',
    acknowledged: 'warning',
    resolved: 'success',
  };
  return severityMap[props.alert.status] || 'secondary';
});

const statusLabel = computed(() => {
  const labelMap: Record<string, string> = {
    active: 'Active',
    acknowledged: 'Acknowledged',
    resolved: 'Resolved',
  };
  return labelMap[props.alert.status] || props.alert.status;
});

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};
</script>

<style scoped>
.alert-card {
  @apply h-full;
}
</style>