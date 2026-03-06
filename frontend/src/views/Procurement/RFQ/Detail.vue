<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useRFQ } from '@/composables/procurement/useRFQ';
import { useSupplierQuotation } from '@/composables/procurement/useSupplierQuotation';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';
import { RequestForQuotation } from '@/types/procurement';
import SupplierQuotationTable from '@/components/Procurement/Tables/SupplierQuotationTable.vue';
import QuotationComparisonModal from '@/components/Procurement/Modals/QuotationComparisonModal.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const permissions = useProcurementPermissions();
const { fetchRFQById, deleteRFQ, sendToSuppliers, awardQuotation, loading } = useRFQ();
const { quotations, fetchQuotationsByRFQ } = useSupplierQuotation();

const rfq = ref<RequestForQuotation | null>(null);
const showComparisonModal = ref(false);
const rfqId = Number(route.params.id);

const canEdit = computed(() => {
  return permissions.canUpdate && 
    (rfq.value?.status === 'Draft' || rfq.value?.status === 'Open');
});

const canSend = computed(() => {
  return permissions.canCreate && rfq.value?.status === 'Draft';
});

const canAward = computed(() => {
  return permissions.canApprove && 
    rfq.value?.status === 'Open' &&
    quotations.value.length > 0;
});

onMounted(async () => {
  await loadRFQ();
  await fetchQuotationsByRFQ(rfqId);
});

const loadRFQ = async () => {
  const data = await fetchRFQById(rfqId);
  if (data) {
    rfq.value = data;
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'RFQ not found',
      life: 3000
    });
    router.push({ name: 'RFQIndex' });
  }
};

const handleEdit = () => {
  router.push({ name: 'RFQEdit', params: { id: rfqId } });
};

const handleDelete = async () => {
  if (confirm('Are you sure you want to delete this RFQ?')) {
    try {
      await deleteRFQ(rfqId);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'RFQ deleted successfully',
        life: 3000
      });
      router.push({ name: 'RFQIndex' });
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete RFQ',
        life: 3000
      });
    }
  }
};

const handleSendToSuppliers = async () => {
  if (confirm('Send this RFQ to selected suppliers?')) {
    try {
      await sendToSuppliers(rfqId);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'RFQ sent to suppliers successfully',
        life: 3000
      });
      await loadRFQ();
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to send RFQ',
        life: 3000
      });
    }
  }
};

const handleCompareQuotations = () => {
  showComparisonModal.value = true;
};

const handleAwardQuotation = async (quotationId: number) => {
  if (confirm('Award this quotation and create a Purchase Order?')) {
    try {
      const po = await awardQuotation(rfqId, quotationId);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Quotation awarded and PO created successfully',
        life: 3000
      });
      router.push({ name: 'PurchaseOrderDetail', params: { id: po.id } });
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to award quotation',
        life: 3000
      });
    }
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(value);
};

const getStatusSeverity = (status: string) => {
  const severities: Record<string, any> = {
    'Draft': 'secondary',
    'Open': 'info',
    'Closed': 'warning',
    'Awarded': 'success',
    'Cancelled': 'danger'
  };
  return severities[status] || 'secondary';
};
</script>

<template>
  <div v-if="rfq" class="p-6">
    <!-- Header -->
    <div class="flex justify-between items-start mb-6">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <Button
            icon="pi pi-arrow-left"
            text
            rounded
            @click="router.push({ name: 'RFQIndex' })"
          />
          <h1 class="text-3xl font-bold">{{ rfq.rfq_number }}</h1>
          <Tag
            :value="rfq.status"
            :severity="getStatusSeverity(rfq.status)"
          />
        </div>
        <p class="text-gray-600">{{ rfq.title }}</p>
      </div>

      <div class="flex gap-2">
        <Button
          v-if="canSend"
          label="Send to Suppliers"
          icon="pi pi-send"
          @click="handleSendToSuppliers"
          :loading="loading"
        />
        <Button
          v-if="quotations.length >= 2"
          label="Compare Quotations"
          icon="pi pi-chart-bar"
          severity="secondary"
          @click="handleCompareQuotations"
        />
        <Button
          v-if="canEdit"
          icon="pi pi-pencil"
          severity="secondary"
          outlined
          @click="handleEdit"
        />
        <Button
          v-if="permissions.canDelete"
          icon="pi pi-trash"
          severity="danger"
          outlined
          @click="handleDelete"
        />
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-sm text-gray-600 mb-2">Issue Date</div>
            <div class="text-xl font-bold">
              {{ new Date(rfq.issue_date).toLocaleDateString('en-PH') }}
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-sm text-gray-600 mb-2">Deadline</div>
            <div class="text-xl font-bold text-orange-600">
              {{ new Date(rfq.deadline).toLocaleDateString('en-PH') }}
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-sm text-gray-600 mb-2">Suppliers Invited</div>
            <div class="text-3xl font-bold text-blue-600">
              {{ rfq.suppliers?.length || 0 }}
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-sm text-gray-600 mb-2">Quotations Received</div>
            <div class="text-3xl font-bold text-green-600">
              {{ quotations.length }}
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- RFQ Details and Suppliers -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- RFQ Information -->
      <Card class="lg:col-span-2">
        <template #title>RFQ Details</template>
        <template #content>
          <div class="space-y-4">
            <div>
              <span class="font-medium text-gray-600">Title:</span>
              <p class="mt-1">{{ rfq.title }}</p>
            </div>
            <div>
              <span class="font-medium text-gray-600">Description:</span>
              <p class="mt-1 text-gray-700">{{ rfq.description || 'N/A' }}</p>
            </div>
            <div v-if="rfq.purchase_requisition" class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium text-gray-600">Related PR:</span>
                <p class="mt-1">
                  <Button
                    :label="`PR-${rfq.purchase_requisition.pr_number}`"
                    text
                    size="small"
                    @click="router.push({ name: 'PurchaseRequisitionDetail', params: { id: rfq.purchase_requisition.id } })"
                  />
                </p>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Invited Suppliers -->
      <Card>
        <template #title>Invited Suppliers ({{ rfq.suppliers?.length || 0 }})</template>
        <template #content>
          <div class="space-y-3">
            <div
              v-for="supplier in rfq.suppliers"
              :key="supplier.id"
              class="p-3 bg-gray-50 rounded"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="font-medium text-sm">{{ supplier.name }}</div>
                  <div class="text-xs text-gray-600 mt-1">
                    <div>{{ supplier.contact_person }}</div>
                    <div>{{ supplier.email }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-1 text-sm">
                  <i class="pi pi-star-fill text-yellow-500 text-xs"></i>
                  <span>{{ supplier.rating || 'N/A' }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Items -->
    <Card class="mb-6">
      <template #title>Items ({{ rfq.items?.length || 0 }})</template>
      <template #content>
        <DataTable :value="rfq.items" responsiveLayout="scroll">
          <Column header="#" style="width: 50px">
            <template #body="{ index }">{{ index + 1 }}</template>
          </Column>
          <Column field="product.name" header="Product" style="min-width: 200px" />
          <Column field="quantity" header="Quantity" />
          <Column field="unit_of_measure" header="Unit" />
          <Column field="specifications" header="Specifications" style="min-width: 200px" />
        </DataTable>
      </template>
    </Card>

    <!-- Received Quotations -->
    <Card>
      <template #title>
        <div class="flex items-center justify-between">
          <span>Received Quotations ({{ quotations.length }})</span>
          <Button
            v-if="quotations.length >= 2"
            label="Compare All"
            icon="pi pi-chart-bar"
            size="small"
            @click="handleCompareQuotations"
          />
        </div>
      </template>
      <template #content>
        <SupplierQuotationTable
          v-if="quotations.length > 0"
          :quotations="quotations"
          @row-click="(q) => router.push({ name: 'SupplierQuotationDetail', params: { id: q.id } })"
          @award="handleAwardQuotation"
        />
        <div v-else class="text-center py-12 text-gray-500">
          <i class="pi pi-inbox text-6xl mb-3"></i>
          <p class="text-lg">No quotations received yet</p>
          <small>Quotations will appear here once suppliers respond to the RFQ</small>
        </div>
      </template>
    </Card>

    <!-- Quotation Comparison Modal -->
    <QuotationComparisonModal
      v-model:visible="showComparisonModal"
      :quotations="quotations"
      @select="(quotationId) => handleAwardQuotation(quotationId)"
    />
  </div>

  <!-- Loading State -->
  <div v-else class="flex items-center justify-center min-h-screen">
    <ProgressSpinner />
  </div>
</template>
