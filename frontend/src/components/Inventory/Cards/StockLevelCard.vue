<!-- frontend/src/components/Inventory/Cards/StockLevelCard.vue -->

<template>
  <Card class="stock-level-card">
    <template #content>
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm text-gray-500 mb-1">{{ label }}</div>
          <div class="text-3xl font-bold" :style="{ color: valueColor }">
            {{ value }}
          </div>
          <div v-if="subtitle" class="text-xs text-gray-400 mt-1">
            {{ subtitle }}
          </div>
        </div>
        <div 
          class="w-14 h-14 rounded-full flex items-center justify-center"
          :style="{ backgroundColor: iconBgColor }"
        >
          <i :class="icon" class="text-2xl" :style="{ color: iconColor }"></i>
        </div>
      </div>

      <!-- Progress Bar -->
      <div v-if="showProgress" class="mt-4">
        <ProgressBar 
          :value="progressValue" 
          :show-value="false"
          :style="{ height: '8px' }"
          :pt="{
            value: { style: { background: progressColor } }
          }"
        />
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>{{ progressLabel }}</span>
          <span>{{ progressValue }}%</span>
        </div>
      </div>

      <!-- Trend Indicator -->
      <div v-if="trend" class="mt-3 flex items-center gap-2">
        <i 
          :class="trendIcon" 
          :style="{ color: trendColor }"
          class="text-sm"
        ></i>
        <span class="text-sm" :style="{ color: trendColor }">
          {{ trendText }}
        </span>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Card from 'primevue/card';
import ProgressBar from 'primevue/progressbar';

interface Props {
  label: string;
  value: number | string;
  icon: string;
  iconColor?: string;
  iconBgColor?: string;
  valueColor?: string;
  subtitle?: string;
  showProgress?: boolean;
  progressValue?: number;
  progressLabel?: string;
  progressColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: '#3b82f6',
  iconBgColor: 'rgba(59, 130, 246, 0.1)',
  valueColor: '#1f2937',
  showProgress: false,
  progressValue: 0,
  progressColor: '#3b82f6',
});

const trendIcon = computed(() => {
  if (props.trend === 'up') return 'pi pi-arrow-up';
  if (props.trend === 'down') return 'pi pi-arrow-down';
  return 'pi pi-minus';
});

const trendColor = computed(() => {
  if (props.trend === 'up') return '#10b981';
  if (props.trend === 'down') return '#ef4444';
  return '#6b7280';
});
</script>

<style scoped>
.stock-level-card {
  @apply h-full;
}
</style>