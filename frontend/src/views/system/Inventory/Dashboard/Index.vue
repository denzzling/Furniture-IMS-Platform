<template>
  <div class="inventory-dashboard p-4">
    <!-- Page Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">Inventory Dashboard</h1>
        <p class="text-gray-600 mt-1">Real-time inventory overview and monitoring</p>
      </div>
      <Button
        icon="pi pi-refresh"
        label="Refresh"
        severity="secondary"
        outlined
        @click="refreshData"
        :loading="loading"
      />
    </div>

    <!-- Branch Selector -->
    <div class="mb-6">
      <label for="branch" class="block text-sm font-medium mb-2">Select Branch</label>
      <Select
        id="branch"
        v-model="selectedBranchId"
        :options="branches"
        option-label="name"
        option-value="id"
        placeholder="All Branches"
        show-clear
        class="w-full md:w-96"
      />
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Total Items -->
      <Card class="bg-linear-to-br from-blue-500 to-blue-600 text-white">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm mb-1">Total Items</p>
              <p class="text-3xl font-bold">{{ formatNumber(stats.totalItems) }}</p>
            </div>
            <i class="pi pi-box text-4xl opacity-30"></i>
          </div>
        </template>
      </Card>

      <!-- Total Value -->
      <Card class="bg-linear-to-br from-green-500 to-green-600 text-white">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-100 text-sm mb-1">Total Value</p>
              <p class="text-3xl font-bold">{{ formatCurrency(stats.totalValue) }}</p>
            </div>
            <i class="pi pi-wallet text-4xl opacity-30"></i>
          </div>
        </template>
      </Card>

      <!-- Low Stock Items -->
      <Card class="bg-linear-to-br from-orange-500 to-orange-600 text-white">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-orange-100 text-sm mb-1">Low Stock Items</p>
              <p class="text-3xl font-bold">{{ formatNumber(stats.lowStockItems) }}</p>
            </div>
            <i class="pi pi-exclamation-triangle text-4xl opacity-30"></i>
          </div>
        </template>
      </Card>

      <!-- Pending Approvals -->
      <Card class="bg-linear-to-br from-purple-500 to-purple-600 text-white">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-100 text-sm mb-1">Pending Approvals</p>
              <p class="text-3xl font-bold">{{ formatNumber(stats.pendingApprovals) }}</p>
            </div>
            <i class="pi pi-clock text-4xl opacity-30"></i>
          </div>
        </template>
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Latest Alerts -->
      <Card>
        <template #title>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Latest Stock Alerts</h3>
            <Button
              label="View All"
              link
              @click="viewAllAlerts"
            />
          </div>
        </template>
        <template #content>
          <div v-if="loading" class="space-y-3">
            <Skeleton height="60px" v-for="i in 3" :key="i" />
          </div>
          <div v-else-if="latestAlerts.length === 0" class="text-center py-8 text-gray-500">
            <i class="pi pi-check-circle text-4xl mb-2"></i>
            <p>No active alerts</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="alert in latestAlerts"
              :key="alert.id"
              class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
              @click="viewAlert(alert)"
            >
              <div class="flex items-start gap-3">
                <Tag
                  :value="getAlertTypeLabel(alert.alert_type)"
                  :severity="getAlertSeverity(alert.alert_type)"
                  class="text-xs"
                />
                <div class="flex-1">
                  <p class="font-semibold text-sm">{{ alert.inventory?.product?.product_name }}</p>
                  <p class="text-xs text-gray-600">{{ alert.inventory?.branch?.name }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ alert.message }}</p>
                </div>
                <span class="text-xs text-gray-400">{{ formatRelativeTime(alert.created_at) }}</span>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Recent Transactions -->
      <Card>
        <template #title>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Recent Transactions</h3>
            <Button
              label="View All"
              link
              @click="viewAllTransactions"
            />
          </div>
        </template>
        <template #content>
          <div v-if="loading" class="space-y-3">
            <Skeleton height="60px" v-for="i in 5" :key="i" />
          </div>
          <div v-else-if="recentTransactions.length === 0" class="text-center py-8 text-gray-500">
            <i class="pi pi-inbox text-4xl mb-2"></i>
            <p>No recent transactions</p>
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="txn in recentTransactions"
              :key="txn.id"
              class="p-2 border rounded hover:bg-gray-50 transition"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 flex-1">
                  <i :class="`pi ${getTransactionIcon(txn.transaction_type)} text-sm`"></i>
                  <div>
                    <p class="text-sm font-medium">{{ txn.product?.product_name }}</p>
                    <p class="text-xs text-gray-500">{{ txn.branch?.name }} • {{ formatDateTime(txn.transaction_date) }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <span
                    class="text-sm font-semibold"
                    :class="{
                      'text-green-600': txn.quantity_change > 0,
                      'text-red-600': txn.quantity_change < 0
                    }"
                  >
                    {{ txn.quantity_change > 0 ? '+' : '' }}{{ txn.quantity_change }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Quick Actions -->
    <Card>
      <template #title>
        <h3 class="text-lg font-semibold">Quick Actions</h3>
      </template>
      <template #content>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            label="Add Inventory"
            icon="pi pi-plus"
            severity="primary"
            @click="addInventory"
            :disabled="!canCreate"
          />
          <Button
            label="Stock Adjustment"
            icon="pi pi-pencil"
            severity="info"
            @click="createAdjustment"
            :disabled="!canAdjust"
          />
          <Button
            label="Stock Transfer"
            icon="pi pi-arrow-right-arrow-left"
            severity="success"
            @click="createTransfer"
            :disabled="!canTransfer"
          />
          <Button
            label="View Alerts"
            icon="pi pi-bell"
            severity="warning"
            @click="viewAllAlerts"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Select from 'primevue/Select';
import Tag from 'primevue/tag';
import Skeleton from 'primevue/skeleton';

import { useStockAlert } from '../../../composables/Inventory/useStockAlert';
import type { StockAlert, InventoryTransaction } from '../../../../types/inventory';
import type { Branch } from '../../../../types/inventory';
import inventoryApi from '../../../../services/api/inventory';
import { useInventory } from '../../../../composables/inventory/useInventory';
import { useInventoryPermissions } from '../../../../composables/inventory/useInventoryPermissions';

const router = useRouter();
const { branches } = useInventory();
const { canCreate, canAdjust, canTransfer } = useInventoryPermissions();

// Refs
const loading = ref(false);
const selectedBranchId = ref<number | null>(null);
const latestAlerts = ref<StockAlert[]>([]);
const recentTransactions = ref<InventoryTransaction[]>([]);

const stats = ref({
  totalItems: 0,
  totalValue: 0,
  lowStockItems: 0,
  pendingApprovals: 0,
});

/**
 * Load dashboard data
 */
const loadDashboardData = async (): Promise<void> => {
  loading.value = true;
  try {
    const [statsRes, alertsRes, txnRes] = await Promise.all([
      inventoryApi.getDashboardStats(selectedBranchId.value),
      inventoryApi.getLatestAlerts(3, selectedBranchId.value),
      inventoryApi.getRecentTransactions(5, selectedBranchId.value),
    ]);

    stats.value = statsRes.data;
    latestAlerts.value = alertsRes.data;
    recentTransactions.value = txnRes.data;
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * Refresh data
 */
const refreshData = (): void => {
  loadDashboardData();
};

/**
 * Format number
 */
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Format currency
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value);
};

/**
 * Format relative time
 */
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

/**
 * Format date time
 */
const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get alert type label
 */
const getAlertTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
    overstock: 'Overstock',
    reorder_point: 'Reorder',
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
    overstock: 'info',
  };
  return severities[type] || 'info';
};

/**
 * Get transaction icon
 */
const getTransactionIcon = (type: string): string => {
  const icons: Record<string, string> = {
    purchase_receive: 'pi-shopping-cart',
    sales_order: 'pi-dollar',
    stock_adjustment: 'pi-pencil',
    stock_transfer_out: 'pi-arrow-right',
    stock_transfer_in: 'pi-arrow-left',
  };
  return icons[type] || 'pi-circle';
};

/**
 * Navigation methods
 */
const addInventory = (): void => {
  router.push({ name: 'inventory.branch.create' });
};

const createAdjustment = (): void => {
  router.push({ name: 'inventory.adjustments.create' });
};

const createTransfer = (): void => {
  router.push({ name: 'inventory.transfers.create' });
};

const viewAllAlerts = (): void => {
  router.push({ name: 'inventory.alerts' });
};

const viewAllTransactions = (): void => {
  router.push({ name: 'inventory.transactions' });
};

const viewAlert = (alert: StockAlert): void => {
  router.push({ name: 'inventory.alerts', params: { alertId: alert.id } });
};

// Lifecycle
onMounted(() => {
  loadDashboardData();
});
</script>
