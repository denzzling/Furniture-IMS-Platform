<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { usePurchaseOrder } from '@/composables/procurement/usePurchaseOrder';
import { useGoodsReceipt } from '@/composables/procurement/useGoodsReceipt';
import { useSupplierPayment } from '@/composables/procurement/useSupplierPayment';
import { useProcurementPermissions } from '@/composables/procurement/useProcurementPermissions';
import { PurchaseOrder } from '@/types/procurement';
import POApprovalModal from '@/components/Procurement/Modals/POApprovalModal.vue';
import GoodsReceiptTable from '@/components/Procurement/Tables/GoodsReceiptTable.vue';
import SupplierPaymentTable from '@/components/Procurement/Tables/SupplierPaymentTable.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const permissions = useProcurementPermissions();
const { fetchPurchaseOrderById, deletePurchaseOrder, sendToSupplier, printPO, loading } = usePurchaseOrder();
const { goodsReceipts, fetchGoodsReceiptsByPO } = useGoodsReceipt();
const { payments, fetchPaymentsByPO } = useSupplierPayment();

const purchaseOrder = ref<PurchaseOrder | null>(null);
const showApprovalModal = ref(false);
const poId = Number(route.params.id);

const canApprove = computed(() => {
  return permissions.canApprove && purchaseOrder.value?.status === 'Pending';
});

const canSend = computed(() => {
  return permissions.canCreate && 
    (purchaseOrder.value?.status === 'Approved' || purchaseOrder.value?.status === 'Draft');
});

const canEdit = computed(() => {
  return permissions.canUpdate && 
    (purchaseOrder.value?.status === 'Draft' || purchaseOrder.value?.status === 'Pending');
});

onMounted(async () => {
  await loadPO();
  await Promise.all([
    fetchGoodsReceiptsByPO(poId),
    fetchPaymentsByPO(poId)
  ]);
});

const loadPO = async () => {
  const data = await fetchPurchaseOrderById(poId);
  if (data) {
    purchaseOrder.value = data;
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Purchase order not found',
      life: 3000
    });
    router.push({ name: 'PurchaseOrderIndex' });
  }
};

const handleEdit = () => {
  router.push({ name: 'PurchaseOrderEdit', params: { id: poId } });
};

const handleDelete = async () => {
  if (confirm('Are you sure you want to delete this purchase order?')) {
    try {
      await deletePurchaseOrder(poId);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Purchase order deleted successfully',
        life: 3000
      });
      router.push({ name: 'PurchaseOrderIndex' });
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete purchase order',
        life: 3000
      });
    }
  }
};

const handleSendToSupplier = async () => {
  if (confirm('Send this purchase order to the supplier?')) {
    try {
      await sendToSupplier(poId);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Purchase order sent to supplier',
        life: 3000
      });
      await loadPO();
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to send purchase order',
        life: 3000
      });
    }
  }
};

const handlePrint = async () => {
  try {
    await printPO(poId);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Purchase order printed successfully',
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to print purchase order',
      life: 3000
    });
  }
};

const handleApprovalComplete = async () => {
  await loadPO();
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'PO approval processed successfully',
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
    'Sent': 'info',
    'Completed': 'success'
  };
  return severities[status] || 'secondary';
};

const getApprovalStatus = (approver: any) => {
  if (approver.approved_at) return 'Approved';
  if (approver.rejected_at) return 'Rejected';
  return 'Pending';
};

const getApprovalSeverity = (status: string) => {
  const severities: Record<string, any> = {
    'Approved': 'success',
    'Rejected': 'danger',
    'Pending': 'warning'
  };
  return severities[status] || 'secondary';
};
</script>

<template>
  <div v-if="purchaseOrder" class="p-6">
    <!-- Header -->
    <div class="flex justify-between items-start mb-6">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <Button
            icon="pi pi-arrow-left"
            text
            rounded
            @click="router.push({ name: 'PurchaseOrderIndex' })"
          />
          <h1 class="text-3xl font-bold">{{ purchaseOrder.po_number }}</h1>
          <Tag
            :value="purchaseOrder.status"
            :severity="getStatusSeverity(purchaseOrder.status)"
          />
        </div>
        <p class="text-gray-600">{{ purchaseOrder.supplier?.name }} - {{ purchaseOrder.branch?.name }}</p>
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
          v-if="canSend"
          label="Send to Supplier"
          icon="pi pi-send"
          @click="handleSendToSupplier"
          :loading="loading"
        />
        <Button
          label="Print"
          icon="pi pi-print"
          severity="secondary"
          outlined
          @click="handlePrint"
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
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-sm text-gray-600 mb-2">Order Date</div>
            <div class="text-lg font-bold">
              {{ new Date(purchaseOrder.order_date).toLocaleDateString('en-PH') }}
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-sm text-gray-600 mb-2">Expected Delivery</div>
            <div class="text-lg font-bold text-orange-600">
              {{ new Date(purchaseOrder.expected_delivery_date).toLocaleDateString('en-PH') }}
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-sm text-gray-600 mb-2">Total Amount</div>
            <div class="text-2xl font-bold text-blue-600">
              {{ formatCurrency(purchaseOrder.total_amount) }}
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-sm text-gray-600 mb-2">Paid Amount</div>
            <div class="text-2xl font-bold text-green-600">
              {{ formatCurrency(purchaseOrder.paid_amount || 0) }}
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-sm text-gray-600 mb-2">Balance</div>
            <div class="text-2xl font-bold text-red-600">
              {{ formatCurrency(purchaseOrder.total_amount - (purchaseOrder.paid_amount || 0)) }}
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Main Details -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- PO Information -->
      <Card class="lg:col-span-2">
        <template #title>Purchase Order Details</template>
        <template #content>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium text-gray-600">Supplier:</span>
              <p class="mt-1 font-semibold">{{ purchaseOrder.supplier?.name }}</p>
            </div>
            <div>
              <span class="font-medium text-gray-600">Branch:</span>
              <p class="mt-1">{{ purchaseOrder.branch?.name }}</p>
            </div>
            <div>
              <span class="font-medium text-gray-600">Payment Terms:</span>
              <p class="mt-1">{{ purchaseOrder.payment_terms }}</p>
            </div>
            <div>
              <span class="font-medium text-gray-600">Delivery Terms:</span>
              <p class="mt-1">{{ purchaseOrder.delivery_terms || 'N/A' }}</p>
            </div>
            <div class="col-span-2">
              <span class="font-medium text-gray-600">Terms & Conditions:</span>
              <p class="mt-1 text-gray-700">{{ purchaseOrder.terms_and_conditions || 'N/A' }}</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Approval Chain -->
      <Card>
        <template #title>Approval Status</template>
        <template #content>
          <div class="space-y-3 text-sm">
            <div
              v-for="(approver, index) in purchaseOrder.approvers"
              :key="index"
              class="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div>
                <div class="font-medium">{{ approver.role }}</div>
                <div class="text-xs text-gray-600">{{ approver.name || 'Pending' }}</div>
              </div>
              <Tag
                :value="getApprovalStatus(approver)"
                :severity="getApprovalSeverity(getApprovalStatus(approver))"
                size="small"
              />
            </div>
            <div v-if="!purchaseOrder.approvers || purchaseOrder.approvers.length === 0" class="text-center py-4 text-gray-500">
              No approvers assigned
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Amount Breakdown -->
    <Card class="mb-6">
      <template #title>Amount Breakdown</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
          <div class="p-3 bg-blue-50 rounded">
            <div class="text-gray-600 mb-1">Subtotal</div>
            <div class="text-xl font-bold text-blue-600">{{ formatCurrency(purchaseOrder.subtotal) }}</div>
          </div>
          <div class="p-3 bg-green-50 rounded">
            <div class="text-gray-600 mb-1">Tax</div>
            <div class="text-xl font-bold text-green-600">{{ formatCurrency(purchaseOrder.tax_amount) }}</div>
          </div>
          <div class="p-3 bg-purple-50 rounded">
            <div class="text-gray-600 mb-1">Shipping</div>
            <div class="text-xl font-bold text-purple-600">{{ formatCurrency(purchaseOrder.shipping_cost) }}</div>
          </div>
          <div class="p-3 bg-yellow-50 rounded">
            <div class="text-gray-600 mb-1">Discount</div>
            <div class="text-xl font-bold text-yellow-600">-{{ formatCurrency(purchaseOrder.discount_amount) }}</div>
          </div>
          <div class="p-3 bg-gray-100 rounded">
            <div class="text-gray-600 mb-1">Total</div>
            <div class="text-2xl font-bold">{{ formatCurrency(purchaseOrder.total_amount) }}</div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Items -->
    <Card class="mb-6">
      <template #title>Order Items ({{ purchaseOrder.items?.length || 0 }})</template>
      <template #content>
        <DataTable :value="purchaseOrder.items" responsiveLayout="scroll">
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
          <Column field="quantity" header="Quantity" />
          <Column field="unit_of_measure" header="Unit" />
          <Column header="Unit Price">
            <template #body="{ data }">
              {{ formatCurrency(data.unit_price) }}
            </template>
          </Column>
          <Column header="Tax Rate">
            <template #body="{ data }">
              {{ data.tax_rate || 0 }}%
            </template>
          </Column>
          <Column header="Discount">
            <template #body="{ data }">
              {{ data.discount || 0 }}%
            </template>
          </Column>
          <Column header="Line Total">
            <template #body="{ data }">
              <span class="font-semibold">
                {{ formatCurrency(data.quantity * data.unit_price) }}
              </span>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Goods Receipts & Payments -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Goods Receipts -->
      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <span>Goods Receipts ({{ goodsReceipts.length }})</span>
            <Button
              v-if="permissions.canCreate && purchaseOrder.status === 'Approved'"
              label="Create Receipt"
              icon="pi pi-plus"
              size="small"
              @click="router.push({ name: 'GoodsReceiptCreate', query: { po_id: poId } })"
            />
          </div>
        </template>
        <template #content>
          <GoodsReceiptTable
            v-if="goodsReceipts.length > 0"
            :goods-receipts="goodsReceipts"
            @row-click="(gr) => router.push({ name: 'GoodsReceiptDetail', params: { id: gr.id } })"
          />
          <div v-else class="text-center py-8 text-gray-500">
            <i class="pi pi-inbox text-4xl mb-2"></i>
            <p>No goods receipts recorded</p>
          </div>
        </template>
      </Card>

      <!-- Payments -->
      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <span>Payments ({{ payments.length }})</span>
            <Button
              v-if="permissions.canCreate && purchaseOrder.status === 'Approved'"
              label="Create Payment"
              icon="pi pi-plus"
              size="small"
              @click="router.push({ name: 'SupplierPaymentCreate', query: { po_id: poId } })"
            />
          </div>
        </template>
        <template #content>
          <SupplierPaymentTable
            v-if="payments.length > 0"
            :payments="payments"
            @row-click="(payment) => router.push({ name: 'SupplierPaymentDetail', params: { id: payment.id } })"
          />
          <div v-else class="text-center py-8 text-gray-500">
            <i class="pi pi-inbox text-4xl mb-2"></i>
            <p>No payments recorded</p>
          </div>
        </template>
      </Card>
    </div>

    <!-- Approval Modal -->
    <POApprovalModal
      v-model:visible="showApprovalModal"
      :purchase-order="purchaseOrder"
      @approved="handleApprovalComplete"
      @rejected="handleApprovalComplete"
    />
  </div>

  <!-- Loading State -->
  <div v-else class="flex items-center justify-center min-h-screen">
    <ProgressSpinner />
  </div>
</template>
