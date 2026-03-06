<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePurchaseRequisition } from '@/composables/procurement/usePurchaseRequisition';
import { useRFQ } from '@/composables/procurement/useRFQ';
import { usePurchaseOrder } from '@/composables/procurement/usePurchaseOrder';
import { useSupplier } from '@/composables/procurement/useSupplier';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';

const router = useRouter();
const permissions = useProcurementPermissions();
const { purchaseRequisitions, fetchPurchaseRequisitions } = usePurchaseRequisition();
const { rfqs, fetchRFQs } = useRFQ();
const { purchaseOrders, fetchPurchaseOrders } = usePurchaseOrder();
const { suppliers, fetchSuppliers } = useSupplier();

const stats = ref({
  totalSuppliers: 0,
  activeSuppliers: 0,
  pendingPRs: 0,
  activeRFQs: 0,
  pendingPOs: 0,
  totalSpend: 0
});

const recentActivity = ref<any[]>([]);

onMounted(async () => {
  await Promise.all([
    fetchSuppliers(),
    fetchPurchaseRequisitions(),
    fetchRFQs(),
    fetchPurchaseOrders()
  ]);

  calculateStats();
  loadRecentActivity();
});

const calculateStats = () => {
  stats.value.totalSuppliers = suppliers.value.length;
  stats.value.activeSuppliers = suppliers.value.filter(s => s.status === 'Active').length;
  stats.value.pendingPRs = purchaseRequisitions.value.filter(pr => pr.status === 'Pending').length;
  stats.value.activeRFQs = rfqs.value.filter(rfq => rfq.status === 'Open').length;
  stats.value.pendingPOs = purchaseOrders.value.filter(po => po.status === 'Pending').length;
  stats.value.totalSpend = purchaseOrders.value
    .filter(po => po.status === 'Approved' || po.status === 'Completed')
    .reduce((sum, po) => sum + po.total_amount, 0);
};

const loadRecentActivity = () => {
  const activities: any[] = [];
  
  // Add recent PRs
  purchaseRequisitions.value.slice(0, 3).forEach(pr => {
    activities.push({
      type: 'Purchase Requisition',
      title: `PR-${pr.pr_number}`,
      description: `${pr.branch?.name} - ${pr.status}`,
      date: pr.created_at,
      status: pr.status,
      link: { name: 'PurchaseRequisitionDetail', params: { id: pr.id } }
    });
  });

  // Add recent RFQs
  rfqs.value.slice(0, 3).forEach(rfq => {
    activities.push({
      type: 'Request for Quotation',
      title: rfq.rfq_number,
      description: `${rfq.title} - ${rfq.status}`,
      date: rfq.created_at,
      status: rfq.status,
      link: { name: 'RFQDetail', params: { id: rfq.id } }
    });
  });

  recentActivity.value = activities.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 5);
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0
  }).format(value);
};

const navigateTo = (routeName: string) => {
  router.push({ name: routeName });
};
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">Procurement Dashboard</h1>
      <p class="text-gray-600">Overview of procurement activities and metrics</p>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <!-- Total Suppliers -->
      <Card class="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <template #content>
          <div class="flex justify-between items-start">
            <div>
              <div class="text-sm opacity-90 mb-2">Total Suppliers</div>
              <div class="text-4xl font-bold">{{ stats.totalSuppliers }}</div>
              <div class="text-xs mt-2 opacity-75">{{ stats.activeSuppliers }} Active</div>
            </div>
            <i class="pi pi-users text-5xl opacity-20"></i>
          </div>
        </template>
      </Card>

      <!-- Pending PRs -->
      <Card class="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <template #content>
          <div class="flex justify-between items-start">
            <div>
              <div class="text-sm opacity-90 mb-2">Pending PRs</div>
              <div class="text-4xl font-bold">{{ stats.pendingPRs }}</div>
              <div class="text-xs mt-2 opacity-75">Awaiting Approval</div>
            </div>
            <i class="pi pi-file-edit text-5xl opacity-20"></i>
          </div>
        </template>
      </Card>

      <!-- Active RFQs -->
      <Card class="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <template #content>
          <div class="flex justify-between items-start">
            <div>
              <div class="text-sm opacity-90 mb-2">Active RFQs</div>
              <div class="text-4xl font-bold">{{ stats.activeRFQs }}</div>
              <div class="text-xs mt-2 opacity-75">Open for Quotations</div>
            </div>
            <i class="pi pi-inbox text-5xl opacity-20"></i>
          </div>
        </template>
      </Card>

      <!-- Pending POs -->
      <Card class="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
        <template #content>
          <div class="flex justify-between items-start">
            <div>
              <div class="text-sm opacity-90 mb-2">Pending POs</div>
              <div class="text-4xl font-bold">{{ stats.pendingPOs }}</div>
              <div class="text-xs mt-2 opacity-75">Awaiting Approval</div>
            </div>
            <i class="pi pi-shopping-cart text-5xl opacity-20"></i>
          </div>
        </template>
      </Card>

      <!-- Total Spend -->
      <Card class="bg-gradient-to-br from-green-500 to-green-600 text-white md:col-span-2">
        <template #content>
          <div class="flex justify-between items-start">
            <div>
              <div class="text-sm opacity-90 mb-2">Total Procurement Spend</div>
              <div class="text-4xl font-bold">{{ formatCurrency(stats.totalSpend) }}</div>
              <div class="text-xs mt-2 opacity-75">Approved & Completed Orders</div>
            </div>
            <i class="pi pi-dollar text-5xl opacity-20"></i>
          </div>
        </template>
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Quick Actions -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-bolt"></i>
            <span>Quick Actions</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-2 gap-3">
            <Button
              v-if="permissions.canCreate"
              label="Create Purchase Requisition"
              icon="pi pi-plus"
              @click="navigateTo('PurchaseRequisitionCreate')"
              class="w-full"
            />
            <Button
              v-if="permissions.canCreate"
              label="Create RFQ"
              icon="pi pi-file"
              severity="secondary"
              @click="navigateTo('RFQCreate')"
              class="w-full"
            />
            <Button
              v-if="permissions.canCreate"
              label="Add Supplier"
              icon="pi pi-user-plus"
              severity="success"
              outlined
              @click="navigateTo('SupplierCreate')"
              class="w-full"
            />
            <Button
              label="View All Suppliers"
              icon="pi pi-users"
              severity="help"
              outlined
              @click="navigateTo('SupplierIndex')"
              class="w-full"
            />
          </div>
        </template>
      </Card>

      <!-- Recent Activity -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-history"></i>
            <span>Recent Activity</span>
          </div>
        </template>
        <template #content>
          <div v-if="recentActivity.length > 0" class="space-y-3">
            <div
              v-for="(activity, index) in recentActivity"
              :key="index"
              class="flex items-start gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer transition"
              @click="router.push(activity.link)"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-semibold text-sm">{{ activity.title }}</span>
                  <Tag :value="activity.status" severity="info" size="small" />
                </div>
                <div class="text-xs text-gray-600">{{ activity.description }}</div>
                <div class="text-xs text-gray-400 mt-1">
                  {{ new Date(activity.date).toLocaleDateString('en-PH') }}
                </div>
              </div>
              <i class="pi pi-chevron-right text-gray-400 text-sm"></i>
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-500">
            <i class="pi pi-inbox text-4xl mb-2"></i>
            <p>No recent activity</p>
          </div>
        </template>
      </Card>
    </div>

    <!-- Pending Approvals (if user has approval permissions) -->
    <Card v-if="permissions.canApprove" class="mt-6">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-check-circle"></i>
          <span>Pending Approvals</span>
        </div>
      </template>
      <template #content>
        <div class="space-y-3">
          <!-- Pending PRs -->
          <div v-if="stats.pendingPRs > 0" class="flex items-center justify-between p-3 bg-orange-50 rounded">
            <div>
              <div class="font-semibold">Purchase Requisitions</div>
              <div class="text-sm text-gray-600">{{ stats.pendingPRs }} pending approval</div>
            </div>
            <Button
              label="Review"
              icon="pi pi-arrow-right"
              size="small"
              @click="navigateTo('PurchaseRequisitionIndex')"
            />
          </div>

          <!-- Pending POs -->
          <div v-if="stats.pendingPOs > 0" class="flex items-center justify-between p-3 bg-yellow-50 rounded">
            <div>
              <div class="font-semibold">Purchase Orders</div>
              <div class="text-sm text-gray-600">{{ stats.pendingPOs }} pending approval</div>
            </div>
            <Button
              label="Review"
              icon="pi pi-arrow-right"
              size="small"
              @click="navigateTo('PurchaseOrderIndex')"
            />
          </div>

          <div v-if="stats.pendingPRs === 0 && stats.pendingPOs === 0" class="text-center py-8 text-gray-500">
            <i class="pi pi-check-circle text-4xl mb-2 text-green-500"></i>
            <p>No pending approvals</p>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
