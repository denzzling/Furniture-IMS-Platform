<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { usePurchaseRequisition } from '@/composables/procurement/usePurchaseRequisition';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';
import { PurchaseRequisition } from '@/types/procurement';
import PRApprovalModal from '@/components/Procurement/Modals/PRApprovalModal.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const permissions = useProcurementPermissions();
const { 
  fetchPurchaseRequisitionById, 
  deletePurchaseRequisition,
  convertToPO,
  convertToRFQ,
  loading 
} = usePurchaseRequisition();

const purchaseRequisition = ref<PurchaseRequisition | null>(null);
const showApprovalModal = ref(false);
const prId = Number(route.params.id);

const canApprove = computed(() => {
  return permissions.canApprove && 
    purchaseRequisition.value?.status === 'Pending';
});

const canConvert = computed(() => {
  return permissions.canCreate && 
    purchaseRequisition.value?.status === 'Approved';
});

onMounted(async () => {
  await loadPR();
});

const loadPR = async () => {
  const data = await fetchPurchaseRequisitionById(prId);
  if (data) {
    purchaseRequisition.value = data;
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Purchase requisition not found',
      life: 3000
    });
    router.push({ name: 'PurchaseRequisitionIndex' });
  }
};

const handleEdit = () => {
  router.push({ name: 'PurchaseRequisitionEdit', params: { id: prId } });
};

const handleDelete = async () => {
  if (confirm('Are you sure you want to delete this purchase requisition?')) {
    try {
      await deletePurchaseRequisition(prId);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Purchase requisition deleted successfully',
        life: 3000
      });
      router.push({ name: 'PurchaseRequisitionIndex' });
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete purchase requisition',
        life: 3000
      });
    }
  }
};

const handleConvertToPO = async () => {
  if (confirm('Convert this PR to a Purchase Order?')) {
    try {
      const po = await convertToPO(prId);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Converted to Purchase Order successfully',
        life: 3000
      });
      router.push({ name: 'PurchaseOrderDetail', params: { id: po.id } });
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to convert to PO',
        life: 3000
      });
    }
  }
};

const handleConvertToRFQ = async () => {
  if (confirm('Convert this PR to a Request for Quotation?')) {
    try {
      const rfq = await convertToRFQ(prId);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Converted to RFQ successfully',
        life: 3000
      });
      router.push({ name: 'RFQDetail', params: { id: rfq.id } });
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to convert to RFQ',
        life: 3000
      });
    }
  }
};

const handleApprovalComplete = async () => {
  await loadPR();
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'PR approval processed successfully',
    life: 3000
  });
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
    'Pending': 'warning',
    'Approved': 'success',
    'Rejected': 'danger',
    'Converted': 'info'
  };
  return severities[status] || 'secondary';
};

const getPrioritySeverity = (priority: number) => {
  if (priority >= 4) return 'danger';
  if (priority >= 3) return 'warning';
  return 'info';
};
</script>

<template>
  <div v-if="purchaseRequisition" class="p-6">
    <!-- Header -->
    <div class="flex justify-between items-start mb-6">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <Button
            icon="pi pi-arrow-left"
            text
            rounded
            @click="router.push({ name: 'PurchaseRequisitionIndex' })"
          />
          <h1 class="text-3xl font-bold">PR-{{ purchaseRequisition.pr_number }}</h1>
          <Tag
            :value="purchaseRequisition.status"
            :severity="getStatusSeverity(purchaseRequisition.status)"
          />
        </div>
        <p class="text-gray-600">{{ purchaseRequisition.branch?.name }} - {{ purchaseRequisition.department }}</p>
      </div>

      <div class="flex gap-2">
        <Button
          v-if="canApprove"
          label="Approve/Reject"
          icon="pi pi-check-circle"
          severity="warning"
          @click="showApprovalModal = true"
        />
        <Button
          v-if="canConvert && purchaseRequisition.procurement_route === 'Branch Direct'"
          label="Convert to PO"
          icon="pi pi-arrow-right"
          @click="handleConvertToPO"
        />
        <Button
          v-if="canConvert && purchaseRequisition.procurement_route === 'RFQ Required'"
          label="Convert to RFQ"
          icon="pi pi-arrow-right"
          @click="handleConvertToRFQ"
        />
        <Button
          v-if="permissions.canUpdate && purchaseRequisition.status === 'Draft'"
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
            <div class="text-sm text-gray-600 mb-2">Request Date</div>
            <div class="text-xl font-bold">
              {{ new Date(purchaseRequisition.request_date).toLocaleDateString('en-PH') }}
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-sm text-gray-600 mb-2">Priority</div>
            <Tag
              :value="`Priority ${purchaseRequisition.priority}`"
              :severity="getPrioritySeverity(purchaseRequisition.priority)"
              class="text-lg px-4 py-2"
            />
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-sm text-gray-600 mb-2">Estimated Total</div>
            <div class="text-2xl font-bold text-blue-600">
              {{ formatCurrency(purchaseRequisition.estimated_total) }}
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-sm text-gray-600 mb-2">Procurement Route</div>
            <div class="text-lg font-semibold text-purple-600">
              {{ purchaseRequisition.procurement_route }}
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Details Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- PR Information -->
      <Card class="lg:col-span-2">
        <template #title>Purchase Requisition Details</template>
        <template #content>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium text-gray-600">Branch:</span>
              <p class="mt-1">{{ purchaseRequisition.branch?.name }}</p>
            </div>
            <div>
              <span class="font-medium text-gray-600">Department:</span>
              <p class="mt-1">{{ purchaseRequisition.department }}</p>
            </div>
            <div>
              <span class="font-medium text-gray-600">Request Date:</span>
              <p class="mt-1">{{ new Date(purchaseRequisition.request_date).toLocaleDateString('en-PH') }}</p>
            </div>
            <div>
              <span class="font-medium text-gray-600">Required By:</span>
              <p class="mt-1">{{ new Date(purchaseRequisition.required_by_date).toLocaleDateString('en-PH') }}</p>
            </div>
            <div>
              <span class="font-medium text-gray-600">Requested By:</span>
              <p class="mt-1">{{ purchaseRequisition.requested_by?.name || 'N/A' }}</p>
            </div>
            <div>
              <span class="font-medium text-gray-600">Approved By:</span>
              <p class="mt-1">{{ purchaseRequisition.approved_by?.name || 'Pending' }}</p>
            </div>
            <div class="col-span-2">
              <span class="font-medium text-gray-600">Purpose:</span>
              <p class="mt-1">{{ purchaseRequisition.purpose || 'N/A' }}</p>
            </div>
            <div v-if="purchaseRequisition.rejection_reason" class="col-span-2">
              <span class="font-medium text-red-600">Rejection Reason:</span>
              <p class="mt-1 text-red-700">{{ purchaseRequisition.rejection_reason }}</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Approval History -->
      <Card>
        <template #title>Approval History</template>
        <template #content>
          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-3">
              <i class="pi pi-circle-fill text-blue-500 text-xs mt-1"></i>
              <div>
                <div class="font-medium">Created</div>
                <div class="text-xs text-gray-500">
                  {{ new Date(purchaseRequisition.created_at).toLocaleString('en-PH') }}
                </div>
              </div>
            </div>
            <div v-if="purchaseRequisition.status === 'Approved'" class="flex items-start gap-3">
              <i class="pi pi-circle-fill text-green-500 text-xs mt-1"></i>
              <div>
                <div class="font-medium">Approved</div>
                <div class="text-xs text-gray-500">
                  By {{ purchaseRequisition.approved_by?.name }}
                </div>
              </div>
            </div>
            <div v-if="purchaseRequisition.status === 'Rejected'" class="flex items-start gap-3">
              <i class="pi pi-circle-fill text-red-500 text-xs mt-1"></i>
              <div>
                <div class="font-medium">Rejected</div>
                <div class="text-xs text-gray-500">
                  By {{ purchaseRequisition.approved_by?.name }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Items -->
    <Card class="mt-6">
      <template #title>Requested Items ({{ purchaseRequisition.items?.length || 0 }})</template>
      <template #content>
        <DataTable :value="purchaseRequisition.items" responsiveLayout="scroll">
          <Column header="#" style="width: 50px">
            <template #body="{ index }">{{ index + 1 }}</template>
          </Column>
          <Column field="product.name" header="Product" style="min-width: 200px">
            <template #body="{ data }">
              <div>
                <div class="font-medium">{{ data.product?.name }}</div>
                <div v-if="data.product_variation" class="text-xs text-gray-500">
                  {{ data.product_variation.name }}
                </div>
              </div>
            </template>
          </Column>
          <Column field="quantity_requested" header="Quantity" />
          <Column field="unit_of_measure" header="Unit" />
          <Column header="Est. Unit Cost">
            <template #body="{ data }">
              {{ formatCurrency(data.estimated_unit_cost) }}
            </template>
          </Column>
          <Column header="Total Cost">
            <template #body="{ data }">
              <span class="font-semibold">
                {{ formatCurrency(data.quantity_requested * data.estimated_unit_cost) }}
              </span>
            </template>
          </Column>
          <Column field="purpose" header="Purpose" style="min-width: 150px" />
        </DataTable>

        <div class="flex justify-end mt-4 p-4 border-t">
          <div class="text-right">
            <div class="text-gray-600 mb-1">Estimated Total:</div>
            <div class="text-2xl font-bold text-blue-600">
              {{ formatCurrency(purchaseRequisition.estimated_total) }}
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Approval Modal -->
    <PRApprovalModal
      v-model:visible="showApprovalModal"
      :purchase-requisition="purchaseRequisition"
      @approved="handleApprovalComplete"
      @rejected="handleApprovalComplete"
    />
  </div>

  <!-- Loading State -->
  <div v-else class="flex items-center justify-center min-h-screen">
    <ProgressSpinner />
  </div>
</template>
