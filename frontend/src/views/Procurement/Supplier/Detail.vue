<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useSupplier } from '@/composables/procurement/useSupplier';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const { 
  supplier, 
  supplierPerformance, 
  loading, 
  fetchSupplierById, 
  fetchSupplierPerformance,
  updateSupplier,
  deleteSupplier 
} = useSupplier();

const { canUpdate, canDelete } = useProcurementPermissions();

const activeTab = ref(0);
const showEditDialog = ref(false);

const supplierId = computed(() => Number(route.params.id));

onMounted(async () => {
  await loadSupplier();
  await loadPerformance();
});

const loadSupplier = async () => {
  await fetchSupplierById(supplierId.value);
};

const loadPerformance = async () => {
  await fetchSupplierPerformance(supplierId.value);
};

const handleEdit = () => {
  router.push(`/procurement/suppliers/${supplierId.value}/edit`);
};

const handleDelete = async () => {
  if (confirm(`Are you sure you want to delete "${supplier.value?.name}"? This action cannot be undone.`)) {
    try {
      await deleteSupplier(supplierId.value);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Supplier deleted successfully',
        life: 3000
      });
      router.push('/procurement/suppliers');
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to delete supplier',
        life: 5000
      });
    }
  }
};

const getStatusSeverity = (status: string) => {
  const severities: Record<string, any> = {
    'Active': 'success',
    'Inactive': 'warning',
    'Blacklisted': 'danger'
  };
  return severities[status] || 'secondary';
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(value);
};
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Button
          icon="pi pi-arrow-left"
          severity="secondary"
          text
          rounded
          @click="router.push('/procurement/suppliers')"
        />
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{{ supplier?.name }}</h1>
          <p class="text-gray-600 mt-1">{{ supplier?.supplier_type }}</p>
        </div>
      </div>

      <div class="flex gap-2">
        <Button
          v-if="canUpdate"
          label="Edit"
          icon="pi pi-pencil"
          severity="info"
          outlined
          @click="handleEdit"
        />
        <Button
          v-if="canDelete"
          label="Delete"
          icon="pi pi-trash"
          severity="danger"
          outlined
          @click="handleDelete"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Content -->
    <div v-else-if="supplier" class="space-y-6">
      <!-- Status Card -->
      <Card>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-1">Status</div>
              <Tag :value="supplier.status" :severity="getStatusSeverity(supplier.status)" class="text-lg" />
            </div>
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-1">Rating</div>
              <div class="flex items-center justify-center gap-1">
                <i class="pi pi-star-fill text-yellow-500 text-xl"></i>
                <span class="text-2xl font-bold">{{ supplier.rating || 'N/A' }}</span>
              </div>
            </div>
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-1">Total Orders</div>
              <div class="text-2xl font-bold text-blue-600">{{ supplierPerformance?.total_orders || 0 }}</div>
            </div>
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-1">Total Spent</div>
              <div class="text-2xl font-bold text-green-600">
                {{ formatCurrency(supplierPerformance?.total_amount || 0) }}
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Tabs -->
      <TabView v-model:activeIndex="activeTab">
        <!-- Details Tab -->
        <TabPanel header="Details">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Contact Information -->
            <Card>
              <template #title>
                <div class="flex items-center gap-2">
                  <i class="pi pi-user"></i>
                  <span>Contact Information</span>
                </div>
              </template>
              <template #content>
                <div class="space-y-3 text-sm">
                  <div>
                    <div class="font-medium text-gray-600">Contact Person</div>
                    <div class="mt-1">{{ supplier.contact_person }}</div>
                  </div>
                  <div>
                    <div class="font-medium text-gray-600">Email</div>
                    <div class="mt-1">{{ supplier.email }}</div>
                  </div>
                  <div>
                    <div class="font-medium text-gray-600">Phone</div>
                    <div class="mt-1">{{ supplier.phone }}</div>
                  </div>
                  <div v-if="supplier.mobile">
                    <div class="font-medium text-gray-600">Mobile</div>
                    <div class="mt-1">{{ supplier.mobile }}</div>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Address -->
            <Card>
              <template #title>
                <div class="flex items-center gap-2">
                  <i class="pi pi-map-marker"></i>
                  <span>Address</span>
                </div>
              </template>
              <template #content>
                <div class="space-y-2 text-sm">
                  <div>{{ supplier.address_line1 }}</div>
                  <div v-if="supplier.address_line2">{{ supplier.address_line2 }}</div>
                  <div>{{ supplier.city }}, {{ supplier.province }}</div>
                  <div>{{ supplier.postal_code }}</div>
                  <div>{{ supplier.country }}</div>
                </div>
              </template>
            </Card>

            <!-- Business Details -->
            <Card>
              <template #title>
                <div class="flex items-center gap-2">
                  <i class="pi pi-briefcase"></i>
                  <span>Business Details</span>
                </div>
              </template>
              <template #content>
                <div class="space-y-3 text-sm">
                  <div>
                    <div class="font-medium text-gray-600">Supplier Type</div>
                    <div class="mt-1">{{ supplier.supplier_type }}</div>
                  </div>
                  <div v-if="supplier.tax_id">
                    <div class="font-medium text-gray-600">Tax ID</div>
                    <div class="mt-1">{{ supplier.tax_id }}</div>
                  </div>
                  <div v-if="supplier.payment_terms">
                    <div class="font-medium text-gray-600">Payment Terms</div>
                    <div class="mt-1">{{ supplier.payment_terms }}</div>
                  </div>
                  <div v-if="supplier.credit_limit">
                    <div class="font-medium text-gray-600">Credit Limit</div>
                    <div class="mt-1">{{ formatCurrency(supplier.credit_limit) }}</div>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Banking Details -->
            <Card v-if="supplier.bank_name || supplier.bank_account_number">
              <template #title>
                <div class="flex items-center gap-2">
                  <i class="pi pi-building"></i>
                  <span>Banking Details</span>
                </div>
              </template>
              <template #content>
                <div class="space-y-3 text-sm">
                  <div v-if="supplier.bank_name">
                    <div class="font-medium text-gray-600">Bank Name</div>
                    <div class="mt-1">{{ supplier.bank_name }}</div>
                  </div>
                  <div v-if="supplier.bank_account_number">
                    <div class="font-medium text-gray-600">Account Number</div>
                    <div class="mt-1">{{ supplier.bank_account_number }}</div>
                  </div>
                  <div v-if="supplier.bank_branch">
                    <div class="font-medium text-gray-600">Branch</div>
                    <div class="mt-1">{{ supplier.bank_branch }}</div>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </TabPanel>

        <!-- Performance Tab -->
        <TabPanel header="Performance">
          <div v-if="supplierPerformance" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <template #content>
                <div class="text-center">
                  <div class="text-sm text-gray-600 mb-2">On-Time Delivery</div>
                  <div class="text-4xl font-bold text-green-600">
                    {{ supplierPerformance.on_time_delivery_rate }}%
                  </div>
                </div>
              </template>
            </Card>

            <Card>
              <template #content>
                <div class="text-center">
                  <div class="text-sm text-gray-600 mb-2">Quality Score</div>
                  <div class="text-4xl font-bold text-blue-600">
                    {{ supplierPerformance.quality_score }}/100
                  </div>
                </div>
              </template>
            </Card>

            <Card>
              <template #content>
                <div class="text-center">
                  <div class="text-sm text-gray-600 mb-2">Avg Lead Time</div>
                  <div class="text-4xl font-bold text-orange-600">
                    {{ supplierPerformance.average_lead_time }} days
                  </div>
                </div>
              </template>
            </Card>
          </div>
          <div v-else class="text-center py-12 text-gray-500">
            No performance data available yet
          </div>
        </TabPanel>

        <!-- Products Tab -->
        <TabPanel header="Products">
          <div class="text-center py-12 text-gray-500">
            Product catalog coming soon...
          </div>
        </TabPanel>

        <!-- Orders Tab -->
        <TabPanel header="Purchase Orders">
          <div class="text-center py-12 text-gray-500">
            Purchase order history coming soon...
          </div>
        </TabPanel>
      </TabView>
    </div>

    <!-- Not Found -->
    <div v-else class="text-center py-12">
      <i class="pi pi-exclamation-triangle text-6xl text-gray-400 mb-4"></i>
      <h2 class="text-2xl font-semibold text-gray-700">Supplier Not Found</h2>
      <p class="text-gray-500 mt-2">The supplier you're looking for doesn't exist.</p>
      <Button
        label="Back to Suppliers"
        class="mt-4"
        @click="router.push('/procurement/suppliers')"
      />
    </div>
  </div>
</template>
