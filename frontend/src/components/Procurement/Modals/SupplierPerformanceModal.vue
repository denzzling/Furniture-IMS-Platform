<script setup lang="ts">
import { ref } from 'vue';
import { Supplier, SupplierPerformance } from '@/types/procurement';

const props = defineProps<{
  visible: boolean;
  supplier: Supplier;
  performance?: SupplierPerformance;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const handleClose = () => {
  emit('update:visible', false);
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(value);
};

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getRateColor = (rate: number) => {
  if (rate >= 95) return 'text-green-600';
  if (rate >= 85) return 'text-blue-600';
  if (rate >= 70) return 'text-yellow-600';
  return 'text-red-600';
};
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="handleClose"
    modal
    :style="{ width: '800px' }"
    :header="`${supplier.name} - Performance Metrics`"
  >
    <div v-if="performance" class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <template #content>
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-2">Total Orders</div>
              <div class="text-3xl font-bold text-blue-600">{{ performance.total_orders }}</div>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-2">Total Amount</div>
              <div class="text-2xl font-bold text-green-600">
                {{ formatCurrency(performance.total_amount) }}
              </div>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-2">Avg Order Value</div>
              <div class="text-2xl font-bold text-purple-600">
                {{ formatCurrency(performance.average_order_value) }}
              </div>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-2">Overall Rating</div>
              <div class="flex items-center justify-center gap-2">
                <i class="pi pi-star-fill text-yellow-500 text-xl"></i>
                <span class="text-2xl font-bold">{{ supplier.rating || 'N/A' }}</span>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Performance Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- On-Time Delivery -->
        <Card>
          <template #content>
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-2">On-Time Delivery Rate</div>
              <div :class="['text-5xl font-bold mb-3', getRateColor(performance.on_time_delivery_rate)]">
                {{ performance.on_time_delivery_rate }}%
              </div>
              <ProgressBar 
                :value="performance.on_time_delivery_rate" 
                :showValue="false"
                :class="performance.on_time_delivery_rate >= 95 ? 'bg-green-200' : performance.on_time_delivery_rate >= 85 ? 'bg-blue-200' : 'bg-yellow-200'"
              />
            </div>
          </template>
        </Card>

        <!-- Quality Score -->
        <Card>
          <template #content>
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-2">Quality Score</div>
              <div :class="['text-5xl font-bold mb-3', getScoreColor(performance.quality_score)]">
                {{ performance.quality_score }}/100
              </div>
              <ProgressBar 
                :value="performance.quality_score" 
                :showValue="false"
              />
            </div>
          </template>
        </Card>

        <!-- Average Lead Time -->
        <Card>
          <template #content>
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-2">Average Lead Time</div>
              <div class="text-5xl font-bold text-orange-600 mb-3">
                {{ performance.average_lead_time }}
              </div>
              <div class="text-sm text-gray-500">days</div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Detailed Metrics -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-line"></i>
            <span>Detailed Performance Breakdown</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span class="font-medium text-gray-700">Completed Orders:</span>
              <span class="font-semibold text-blue-600">{{ performance.completed_orders || 0 }}</span>
            </div>

            <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span class="font-medium text-gray-700">Cancelled Orders:</span>
              <span class="font-semibold text-red-600">{{ performance.cancelled_orders || 0 }}</span>
            </div>

            <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span class="font-medium text-gray-700">On-Time Deliveries:</span>
              <span class="font-semibold text-green-600">
                {{ Math.round((performance.on_time_delivery_rate / 100) * performance.total_orders) }}
              </span>
            </div>

            <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span class="font-medium text-gray-700">Delayed Deliveries:</span>
              <span class="font-semibold text-yellow-600">
                {{ performance.total_orders - Math.round((performance.on_time_delivery_rate / 100) * performance.total_orders) }}
              </span>
            </div>

            <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span class="font-medium text-gray-700">Defect Rate:</span>
              <span class="font-semibold">{{ performance.defect_rate || 0 }}%</span>
            </div>

            <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span class="font-medium text-gray-700">Return Rate:</span>
              <span class="font-semibold">{{ performance.return_rate || 0 }}%</span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Performance Trend (Placeholder) -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar"></i>
            <span>Performance Trend</span>
          </div>
        </template>
        <template #content>
          <div class="text-center py-8 text-gray-500">
            <i class="pi pi-chart-line text-4xl mb-2"></i>
            <p>Performance trend chart will be available soon</p>
            <small>Historical data visualization coming in future updates</small>
          </div>
        </template>
      </Card>
    </div>

    <!-- No Performance Data -->
    <div v-else class="text-center py-12">
      <i class="pi pi-chart-line text-6xl text-gray-400 mb-4"></i>
      <h3 class="text-xl font-semibold text-gray-700">No Performance Data Available</h3>
      <p class="text-gray-500 mt-2">
        Performance metrics will be calculated after the first completed order.
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <Button label="Close" @click="handleClose" />
      </div>
    </template>
  </Dialog>
</template>
