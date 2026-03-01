<!-- views/system/Purchases.vue -->
<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white shadow rounded-xl p-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Purchases</h1>
          <p class="text-gray-600 mt-2">Manage your furniture purchases and supplier orders</p>
        </div>
        <div class="flex space-x-2">
          <Button 
            label="New Purchase" 
            icon="pi pi-plus" 
            @click="showNewPurchaseDialog = true"
          />
          <Button 
            label="Export Report" 
            icon="pi pi-download" 
            severity="secondary"
            @click="exportReport"
          />
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white shadow rounded-xl p-6">
        <div class="flex items-center justify-between">
          <h6 class="text-sm font-semibold text-gray-500">Total Spent (2025)</h6>
          <i class="pi pi-money-bill text-red-500 text-lg"></i>
        </div>
        <p class="text-2xl font-bold text-gray-800 mt-2">₱{{ formatCurrency(totalSpent2025) }}</p>
        <p class="text-sm text-gray-500">{{ purchaseOrders2025.length }} purchase orders</p>
      </div>

      <div class="bg-white shadow rounded-xl p-6">
        <div class="flex items-center justify-between">
          <h6 class="text-sm font-semibold text-gray-500">Total Spent (2026)</h6>
          <i class="pi pi-money-bill text-green-500 text-lg"></i>
        </div>
        <p class="text-2xl font-bold text-gray-800 mt-2">₱{{ formatCurrency(totalSpent2026) }}</p>
        <p class="text-sm text-gray-500">{{ purchaseOrders2026.length }} purchase orders</p>
      </div>

      <div class="bg-white shadow rounded-xl p-6">
        <div class="flex items-center justify-between">
          <h6 class="text-sm font-semibold text-gray-500">Pending Orders</h6>
          <i class="pi pi-clock text-yellow-500 text-lg"></i>
        </div>
        <p class="text-2xl font-bold text-gray-800 mt-2">{{ pendingOrdersCount }}</p>
        <p class="text-sm text-yellow-500">Awaiting delivery</p>
      </div>

      <div class="bg-white shadow rounded-xl p-6">
        <div class="flex items-center justify-between">
          <h6 class="text-sm font-semibold text-gray-500">Avg. Order Value</h6>
          <i class="pi pi-chart-line text-blue-500 text-lg"></i>
        </div>
        <p class="text-2xl font-bold text-gray-800 mt-2">₱{{ formatCurrency(avgOrderValue) }}</p>
        <p class="text-sm text-blue-500">Per purchase order</p>
      </div>
    </div>

    <!-- Year Filter -->
    <div class="bg-white shadow rounded-xl p-6">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-800">Purchase Orders</h3>
        <div class="flex items-center space-x-4">
          <div class="flex space-x-2">
            <Button 
              @click="setYearFilter('all')" 
              :severity="selectedYear === 'all' ? 'primary' : 'secondary'"
              size="small"
            >
              All Years
            </Button>
            <Button 
              @click="setYearFilter('2025')" 
              :severity="selectedYear === '2025' ? 'primary' : 'secondary'"
              size="small"
            >
              2025
            </Button>
            <Button 
              @click="setYearFilter('2026')" 
              :severity="selectedYear === '2026' ? 'primary' : 'secondary'"
              size="small"
            >
              2026
            </Button>
          </div>
          <div class="w-64">
            <IconField>
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText 
                v-model="searchTerm" 
                placeholder="Search purchases..." 
                class="w-full"
              />
            </IconField>
          </div>
        </div>
      </div>
    </div>

    <!-- Purchases Table -->
    <div class="bg-white shadow rounded-xl p-6">
      <DataTable 
        :value="filteredPurchases"
        v-model:selection="selectedPurchases"
        dataKey="id"
        sortMode="multiple" 
        tableStyle="min-width: 50rem"
        paginator
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} purchase orders"
        :loading="loading"
      >
        <!-- Checkbox Column -->
        <Column selectionMode="multiple" headerStyle="width: 1%"></Column>

        <!-- Purchase ID -->
        <Column field="purchaseId" header="PO ID" sortable style="width: 10%">
          <template #body="slotProps">
            <div class="flex items-center">
              <Button 
                icon="pi pi-external-link" 
                text 
                rounded
                size="small"
                class="mr-2"
                @click="viewPurchase(slotProps.data)"
              />
              <span class="font-mono text-blue-600 font-medium">{{ slotProps.data.purchaseId }}</span>
            </div>
          </template>
        </Column>

        <!-- Supplier -->
        <Column field="supplier" header="Supplier" sortable style="width: 15%">
          <template #body="slotProps">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <i class="pi pi-building text-green-600 text-sm"></i>
              </div>
              <div>
                <p class="font-medium">{{ slotProps.data.supplier }}</p>
                <p class="text-xs text-gray-500">{{ slotProps.data.supplierContact }}</p>
              </div>
            </div>
          </template>
        </Column>

        <!-- Date -->
        <Column field="orderDate" header="Order Date" sortable style="width: 12%">
          <template #body="slotProps">
            <div>
              <p class="font-medium">{{ formatDate(slotProps.data.orderDate) }}</p>
              <p class="text-xs text-gray-500">Due: {{ formatDate(slotProps.data.dueDate) }}</p>
            </div>
          </template>
        </Column>

        <!-- Amount -->
        <Column field="amount" header="Amount" sortable style="width: 12%">
          <template #body="slotProps">
            <div class="text-right">
              <p class="font-bold">₱{{ formatCurrency(slotProps.data.amount) }}</p>
              <p class="text-xs text-gray-500">{{ slotProps.data.itemCount }} items</p>
            </div>
          </template>
        </Column>

        <!-- Status -->
        <Column field="status" header="Status" sortable style="width: 12%">
          <template #body="slotProps">
            <Tag 
              :value="slotProps.data.status" 
              :severity="getStatusSeverity(slotProps.data.status)"
              :icon="getStatusIcon(slotProps.data.status)"
              rounded
            />
          </template>
        </Column>

        <!-- Payment Status -->
        <Column field="paymentStatus" header="Payment" sortable style="width: 12%">
          <template #body="slotProps">
            <Tag 
              :value="slotProps.data.paymentStatus" 
              :severity="getPaymentStatusSeverity(slotProps.data.paymentStatus)"
              rounded
            />
          </template>
        </Column>

        <!-- Actions -->
        <Column header="Actions" style="width: 12%">
          <template #body="slotProps">
            <div class="flex space-x-1">
              <Button 
                icon="pi pi-eye" 
                size="small" 
                text 
                rounded
                severity="info"
                @click="viewPurchase(slotProps.data)"
              />
              <Button 
                icon="pi pi-receipt" 
                size="small" 
                text 
                rounded
                severity="secondary"
                @click="viewInvoice(slotProps.data)"
              />
              <Button 
                icon="pi pi-truck" 
                size="small" 
                text 
                rounded
                severity="help"
                @click="trackDelivery(slotProps.data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Monthly Spending Chart -->
    <div class="bg-white shadow rounded-xl p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-semibold text-gray-800">Monthly Spending Overview</h3>
        <div class="flex space-x-2">
          <Button 
            @click="setChartYear('2025')" 
            :severity="chartYear === '2025' ? 'primary' : 'secondary'"
            size="small"
          >
            2025
          </Button>
          <Button 
            @click="setChartYear('2026')" 
            :severity="chartYear === '2026' ? 'primary' : 'secondary'"
            size="small"
          >
            2026
          </Button>
        </div>
      </div>
      <div class="h-72">
        <canvas ref="spendingChartRef"></canvas>
      </div>
    </div>

    <!-- Top Suppliers -->
    <div class="bg-white shadow rounded-xl p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Top Suppliers</h3>
      <div class="space-y-3">
        <div v-for="supplier in topSuppliers" :key="supplier.id"
          class="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <i class="pi pi-building text-green-600"></i>
            </div>
            <div>
              <p class="font-medium">{{ supplier.name }}</p>
              <p class="text-sm text-gray-500">{{ supplier.category }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold">₱{{ formatCurrency(supplier.totalSpent) }}</p>
            <p class="text-sm text-gray-500">{{ supplier.orderCount }} orders</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Purchase Details Dialog -->
    <Dialog 
      v-model:visible="showPurchaseDialog" 
      :header="selectedPurchase ? `Purchase Order: ${selectedPurchase.purchaseId}` : 'Purchase Details'"
      :style="{ width: '800px' }"
    >
      <div v-if="selectedPurchase" class="space-y-6">
        <!-- Purchase Summary -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Supplier</p>
              <p class="font-medium">{{ selectedPurchase.supplier }}</p>
              <p class="text-sm text-gray-500">{{ selectedPurchase.supplierContact }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Order Date</p>
              <p class="font-medium">{{ formatDate(selectedPurchase.orderDate) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Status</p>
              <Tag 
                :value="selectedPurchase.status" 
                :severity="getStatusSeverity(selectedPurchase.status)"
              />
            </div>
            <div>
              <p class="text-sm text-gray-500">Payment Status</p>
              <Tag 
                :value="selectedPurchase.paymentStatus" 
                :severity="getPaymentStatusSeverity(selectedPurchase.paymentStatus)"
              />
            </div>
          </div>
        </div>

        <!-- Items List -->
        <div>
          <h4 class="font-medium text-gray-800 mb-3">Items Ordered</h4>
          <DataTable :value="selectedPurchase.items" class="mb-4">
            <Column field="name" header="Item"></Column>
            <Column field="quantity" header="Qty" style="width: 100px">
              <template #body="slotProps">
                {{ slotProps.data.quantity }}
              </template>
            </Column>
            <Column field="unitPrice" header="Unit Price" style="width: 150px">
              <template #body="slotProps">
                ₱{{ formatCurrency(slotProps.data.unitPrice) }}
              </template>
            </Column>
            <Column header="Total" style="width: 150px">
              <template #body="slotProps">
                ₱{{ formatCurrency(slotProps.data.quantity * slotProps.data.unitPrice) }}
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Totals -->
        <div class="border-t pt-4">
          <div class="flex justify-between mb-2">
            <span class="text-gray-600">Subtotal</span>
            <span>₱{{ formatCurrency(selectedPurchase.subtotal) }}</span>
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-gray-600">Shipping</span>
            <span>₱{{ formatCurrency(selectedPurchase.shipping) }}</span>
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-gray-600">Tax</span>
            <span>₱{{ formatCurrency(selectedPurchase.tax) }}</span>
          </div>
          <div class="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span>₱{{ formatCurrency(selectedPurchase.amount) }}</span>
          </div>
        </div>

        <!-- Delivery Info -->
        <div v-if="selectedPurchase.deliveryInfo">
          <h4 class="font-medium text-gray-800 mb-2">Delivery Information</h4>
          <div class="bg-blue-50 p-3 rounded">
            <p class="text-sm">Estimated Delivery: {{ formatDate(selectedPurchase.deliveryInfo.estimatedDate) }}</p>
            <p class="text-sm">Tracking: {{ selectedPurchase.deliveryInfo.trackingNumber }}</p>
            <p class="text-sm">Carrier: {{ selectedPurchase.deliveryInfo.carrier }}</p>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Close" severity="secondary" @click="showPurchaseDialog = false" />
        <Button label="Print PO" icon="pi pi-print" @click="printPurchaseOrder(selectedPurchase)" />
        <Button label="Mark as Received" icon="pi pi-check" @click="markAsReceived(selectedPurchase)" />
      </template>
    </Dialog>

    <!-- New Purchase Dialog -->
    <Dialog 
      v-model:visible="showNewPurchaseDialog" 
      header="New Purchase Order"
      :style="{ width: '900px' }"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <Select 
              v-model="newPurchase.supplierId" 
              :options="suppliers" 
              optionLabel="name" 
              placeholder="Select Supplier"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
            <DatePicker 
              v-model="newPurchase.expectedDelivery" 
              placeholder="Select Date" 
              showIcon
              dateFormat="yy-mm-dd"
              class="w-full"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Items</label>
          <DataTable :value="newPurchase.items" class="mb-4">
            <Column field="product" header="Product">
              <template #body="slotProps">
                <Select 
                  v-model="slotProps.data.productId" 
                  :options="products" 
                  optionLabel="name" 
                  placeholder="Select Product"
                  class="w-full"
                />
              </template>
            </Column>
            <Column field="quantity" header="Qty" style="width: 100px">
              <template #body="slotProps">
                <InputNumber v-model="slotProps.data.quantity" :min="1" showButtons />
              </template>
            </Column>
            <Column field="unitPrice" header="Unit Price" style="width: 150px">
              <template #body="slotProps">
                <InputNumber 
                  v-model="slotProps.data.unitPrice" 
                  mode="currency" 
                  currency="PHP" 
                  locale="en-PH"
                />
              </template>
            </Column>
            <Column header="Total" style="width: 150px">
              <template #body="slotProps">
                ₱{{ formatCurrency(slotProps.data.quantity * slotProps.data.unitPrice) }}
              </template>
            </Column>
            <Column header="Action" style="width: 80px">
              <template #body="slotProps">
                <Button 
                  icon="pi pi-trash" 
                  severity="danger" 
                  text 
                  rounded
                  @click="removePurchaseItem(slotProps.index)"
                />
              </template>
            </Column>
          </DataTable>
          <Button 
            label="Add Item" 
            icon="pi pi-plus" 
            size="small"
            @click="addPurchaseItem"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Shipping Cost</label>
            <InputNumber 
              v-model="newPurchase.shipping" 
              mode="currency" 
              currency="PHP" 
              locale="en-PH"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tax (%)</label>
            <InputNumber 
              v-model="newPurchase.taxRate" 
              suffix="%" 
              :min="0" 
              :max="100"
              class="w-full"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <Textarea v-model="newPurchase.notes" rows="3" class="w-full" />
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" severity="secondary" @click="showNewPurchaseDialog = false" />
        <Button label="Create Purchase Order" @click="createPurchase" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Chart, registerables } from 'chart.js'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'

// Register Chart.js
Chart.register(...registerables)

// Chart refs
const spendingChartRef = ref<HTMLCanvasElement | null>(null)
let spendingChart: Chart | null = null

// State
const loading = ref(false)
const showPurchaseDialog = ref(false)
const showNewPurchaseDialog = ref(false)
const searchTerm = ref('')
const selectedYear = ref('all')
const chartYear = ref('2025')
const selectedPurchases = ref<any[]>([])
const selectedPurchase = ref<any>(null)

// New Purchase
const newPurchase = ref({
  supplierId: null,
  expectedDelivery: null,
  items: [
    { id: 1, productId: null, quantity: 1, unitPrice: 0 }
  ],
  shipping: 0,
  taxRate: 12,
  notes: ''
})

// Purchase Data for 2025
const purchaseOrders2025 = ref([
  {
    id: 1,
    purchaseId: 'PO-2025-001',
    supplier: 'Woodcraft Manufacturing Inc.',
    supplierContact: 'woodcraft@email.com',
    orderDate: '2025-01-15',
    dueDate: '2025-02-15',
    amount: 125000,
    subtotal: 120000,
    shipping: 3000,
    tax: 2000,
    itemCount: 5,
    status: 'Completed',
    paymentStatus: 'Paid',
    deliveryInfo: {
      estimatedDate: '2025-02-10',
      trackingNumber: 'TRK-2025-001',
      carrier: 'Fast Delivery Co.'
    },
    items: [
      { id: 1, name: 'Oak Wood Planks', quantity: 100, unitPrice: 500 },
      { id: 2, name: 'Wood Glue', quantity: 20, unitPrice: 250 }
    ]
  },
  {
    id: 2,
    purchaseId: 'PO-2025-002',
    supplier: 'Furniture Hardware Supplies',
    supplierContact: 'hardware@email.com',
    orderDate: '2025-02-20',
    dueDate: '2025-03-20',
    amount: 85000,
    subtotal: 82000,
    shipping: 2000,
    tax: 1000,
    itemCount: 8,
    status: 'Processing',
    paymentStatus: 'Partial',
    deliveryInfo: {
      estimatedDate: '2025-03-15',
      trackingNumber: 'TRK-2025-002',
      carrier: 'Nationwide Logistics'
    },
    items: [
      { id: 1, name: 'Drawer Slides', quantity: 50, unitPrice: 800 },
      { id: 2, name: 'Cabinet Knobs', quantity: 200, unitPrice: 150 }
    ]
  },
  {
    id: 3,
    purchaseId: 'PO-2025-003',
    supplier: 'Foam & Fabric Co.',
    supplierContact: 'foamfabric@email.com',
    orderDate: '2025-03-10',
    dueDate: '2025-04-10',
    amount: 75000,
    subtotal: 73000,
    shipping: 1500,
    tax: 500,
    itemCount: 3,
    status: 'Pending',
    paymentStatus: 'Unpaid',
    items: [
      { id: 1, name: 'Memory Foam', quantity: 30, unitPrice: 1500 },
      { id: 2, name: 'Leather Fabric', quantity: 50, unitPrice: 800 }
    ]
  },
  {
    id: 4,
    purchaseId: 'PO-2025-004',
    supplier: 'Metal Works Ltd.',
    supplierContact: 'metalworks@email.com',
    orderDate: '2025-04-05',
    dueDate: '2025-05-05',
    amount: 150000,
    subtotal: 147000,
    shipping: 2000,
    tax: 1000,
    itemCount: 6,
    status: 'Completed',
    paymentStatus: 'Paid',
    deliveryInfo: {
      estimatedDate: '2025-05-01',
      trackingNumber: 'TRK-2025-004',
      carrier: 'Metal Transport Co.'
    },
    items: [
      { id: 1, name: 'Steel Frames', quantity: 25, unitPrice: 4000 },
      { id: 2, name: 'Aluminum Bars', quantity: 50, unitPrice: 800 }
    ]
  },
  {
    id: 5,
    purchaseId: 'PO-2025-005',
    supplier: 'Paint & Coatings Inc.',
    supplierContact: 'paintco@email.com',
    orderDate: '2025-05-15',
    dueDate: '2025-06-15',
    amount: 45000,
    subtotal: 44000,
    shipping: 800,
    tax: 200,
    itemCount: 12,
    status: 'Cancelled',
    paymentStatus: 'Refunded',
    items: [
      { id: 1, name: 'Wood Stain', quantity: 40, unitPrice: 500 },
      { id: 2, name: 'Varnish', quantity: 30, unitPrice: 600 }
    ]
  },
  {
    id: 6,
    purchaseId: 'PO-2025-006',
    supplier: 'Glass & Mirrors Co.',
    supplierContact: 'glassco@email.com',
    orderDate: '2025-06-20',
    dueDate: '2025-07-20',
    amount: 68000,
    subtotal: 67000,
    shipping: 800,
    tax: 200,
    itemCount: 4,
    status: 'Processing',
    paymentStatus: 'Unpaid',
    deliveryInfo: {
      estimatedDate: '2025-07-15',
      trackingNumber: 'TRK-2025-006',
      carrier: 'Fragile Express'
    },
    items: [
      { id: 1, name: 'Tempered Glass', quantity: 10, unitPrice: 4000 },
      { id: 2, name: 'Mirror Panels', quantity: 15, unitPrice: 1800 }
    ]
  }
])

// Purchase Data for 2026
const purchaseOrders2026 = ref([
  {
    id: 7,
    purchaseId: 'PO-2026-001',
    supplier: 'Smart Furniture Tech',
    supplierContact: 'smartfurn@email.com',
    orderDate: '2026-01-10',
    dueDate: '2026-02-10',
    amount: 185000,
    subtotal: 180000,
    shipping: 4000,
    tax: 1000,
    itemCount: 7,
    status: 'Pending',
    paymentStatus: 'Unpaid',
    items: [
      { id: 1, name: 'Smart Motors', quantity: 20, unitPrice: 5000 },
      { id: 2, name: 'Control Panels', quantity: 15, unitPrice: 2000 }
    ]
  },
  {
    id: 8,
    purchaseId: 'PO-2026-002',
    supplier: 'Eco Wood Suppliers',
    supplierContact: 'ecowood@email.com',
    orderDate: '2026-02-15',
    dueDate: '2026-03-15',
    amount: 95000,
    subtotal: 93000,
    shipping: 1500,
    tax: 500,
    itemCount: 9,
    status: 'Completed',
    paymentStatus: 'Paid',
    deliveryInfo: {
      estimatedDate: '2026-03-10',
      trackingNumber: 'TRK-2026-002',
      carrier: 'Eco Transport'
    },
    items: [
      { id: 1, name: 'Bamboo Poles', quantity: 200, unitPrice: 300 },
      { id: 2, name: 'Reclaimed Wood', quantity: 50, unitPrice: 600 }
    ]
  },
  {
    id: 9,
    purchaseId: 'PO-2026-003',
    supplier: 'Luxury Fabrics Ltd.',
    supplierContact: 'luxuryfab@email.com',
    orderDate: '2026-03-05',
    dueDate: '2026-04-05',
    amount: 120000,
    subtotal: 118000,
    shipping: 1500,
    tax: 500,
    itemCount: 5,
    status: 'Processing',
    paymentStatus: 'Partial',
    deliveryInfo: {
      estimatedDate: '2026-03-30',
      trackingNumber: 'TRK-2026-003',
      carrier: 'Premium Logistics'
    },
    items: [
      { id: 1, name: 'Italian Leather', quantity: 40, unitPrice: 2000 },
      { id: 2, name: 'Silk Fabric', quantity: 30, unitPrice: 1000 }
    ]
  },
  {
    id: 10,
    purchaseId: 'PO-2026-004',
    supplier: 'Advanced Hardware Inc.',
    supplierContact: 'advhardware@email.com',
    orderDate: '2026-04-12',
    dueDate: '2026-05-12',
    amount: 75000,
    subtotal: 74000,
    shipping: 800,
    tax: 200,
    itemCount: 15,
    status: 'Pending',
    paymentStatus: 'Unpaid',
    items: [
      { id: 1, name: 'Smart Locks', quantity: 25, unitPrice: 1200 },
      { id: 2, name: 'LED Lighting', quantity: 50, unitPrice: 800 }
    ]
  },
  {
    id: 11,
    purchaseId: 'PO-2026-005',
    supplier: 'Sustainable Materials Co.',
    supplierContact: 'sustainable@email.com',
    orderDate: '2026-05-20',
    dueDate: '2026-06-20',
    amount: 105000,
    subtotal: 103000,
    shipping: 1500,
    tax: 500,
    itemCount: 8,
    status: 'Completed',
    paymentStatus: 'Paid',
    deliveryInfo: {
      estimatedDate: '2026-06-15',
      trackingNumber: 'TRK-2026-005',
      carrier: 'Green Transport'
    },
    items: [
      { id: 1, name: 'Recycled Plastic', quantity: 100, unitPrice: 500 },
      { id: 2, name: 'Cork Boards', quantity: 80, unitPrice: 600 }
    ]
  },
  {
    id: 12,
    purchaseId: 'PO-2026-006',
    supplier: 'Premium Upholstery',
    supplierContact: 'premiumup@email.com',
    orderDate: '2026-06-08',
    dueDate: '2026-07-08',
    amount: 140000,
    subtotal: 138000,
    shipping: 1500,
    tax: 500,
    itemCount: 6,
    status: 'Processing',
    paymentStatus: 'Partial',
    deliveryInfo: {
      estimatedDate: '2026-07-01',
      trackingNumber: 'TRK-2026-006',
      carrier: 'Upholstery Express'
    },
    items: [
      { id: 1, name: 'Memory Foam', quantity: 50, unitPrice: 1200 },
      { id: 2, name: 'Velvet Fabric', quantity: 100, unitPrice: 800 }
    ]
  }
])

// Suppliers
const suppliers = ref([
  { id: 1, name: 'Woodcraft Manufacturing Inc.', email: 'woodcraft@email.com' },
  { id: 2, name: 'Furniture Hardware Supplies', email: 'hardware@email.com' },
  { id: 3, name: 'Foam & Fabric Co.', email: 'foamfabric@email.com' },
  { id: 4, name: 'Metal Works Ltd.', email: 'metalworks@email.com' },
  { id: 5, name: 'Paint & Coatings Inc.', email: 'paintco@email.com' },
  { id: 6, name: 'Glass & Mirrors Co.', email: 'glassco@email.com' },
  { id: 7, name: 'Smart Furniture Tech', email: 'smartfurn@email.com' },
  { id: 8, name: 'Eco Wood Suppliers', email: 'ecowood@email.com' },
  { id: 9, name: 'Luxury Fabrics Ltd.', email: 'luxuryfab@email.com' },
  { id: 10, name: 'Advanced Hardware Inc.', email: 'advhardware@email.com' }
])

// Products
const products = ref([
  { id: 1, name: 'Oak Wood Planks', category: 'Raw Materials' },
  { id: 2, name: 'Wood Glue', category: 'Supplies' },
  { id: 3, name: 'Drawer Slides', category: 'Hardware' },
  { id: 4, name: 'Cabinet Knobs', category: 'Hardware' },
  { id: 5, name: 'Memory Foam', category: 'Upholstery' },
  { id: 6, name: 'Leather Fabric', category: 'Upholstery' },
  { id: 7, name: 'Steel Frames', category: 'Metal' },
  { id: 8, name: 'Aluminum Bars', category: 'Metal' },
  { id: 9, name: 'Wood Stain', category: 'Finishing' },
  { id: 10, name: 'Varnish', category: 'Finishing' }
])

// Computed Properties
const filteredPurchases = computed(() => {
  let filtered = [...purchaseOrders2025.value, ...purchaseOrders2026.value]
  
  // Year filter
  if (selectedYear.value !== 'all') {
    if (selectedYear.value === '2025') {
      filtered = purchaseOrders2025.value
    } else if (selectedYear.value === '2026') {
      filtered = purchaseOrders2026.value
    }
  }
  
  // Search filter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.purchaseId?.toLowerCase().includes(term) ||
      p.supplier?.toLowerCase().includes(term) ||
      p.status?.toLowerCase().includes(term)
    )
  }
  
  return filtered
})

const totalSpent2025 = computed(() => {
  return purchaseOrders2025.value
    .filter(p => p.status === 'Completed')
    .reduce((sum, p) => sum + p.amount, 0)
})

const totalSpent2026 = computed(() => {
  return purchaseOrders2026.value
    .filter(p => p.status === 'Completed')
    .reduce((sum, p) => sum + p.amount, 0)
})

const pendingOrdersCount = computed(() => {
  return [...purchaseOrders2025.value, ...purchaseOrders2026.value]
    .filter(p => p.status === 'Pending' || p.status === 'Processing').length
})

const avgOrderValue = computed(() => {
  const completedOrders = [...purchaseOrders2025.value, ...purchaseOrders2026.value]
    .filter(p => p.status === 'Completed')
  if (completedOrders.length === 0) return 0
  const total = completedOrders.reduce((sum, p) => sum + p.amount, 0)
  return Math.round(total / completedOrders.length)
})

const topSuppliers = computed(() => {
  const allOrders = [...purchaseOrders2025.value, ...purchaseOrders2026.value]
  const supplierMap = new Map()
  
  allOrders.forEach(order => {
    if (!supplierMap.has(order.supplier)) {
      supplierMap.set(order.supplier, {
        id: order.supplier,
        name: order.supplier,
        category: 'Furniture Supplies',
        totalSpent: 0,
        orderCount: 0
      })
    }
    
    const supplier = supplierMap.get(order.supplier)
    supplier.totalSpent += order.amount
    supplier.orderCount++
  })
  
  return Array.from(supplierMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5)
})

// Helper Functions
const formatCurrency = (amount: number) => {
  return amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  } catch (e) {
    return dateString
  }
}

const getStatusSeverity = (status: string) => {
  switch (status) {
    case 'Completed': return 'success'
    case 'Processing': return 'info'
    case 'Pending': return 'warning'
    case 'Cancelled': return 'danger'
    default: return 'secondary'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Completed': return 'pi pi-check-circle'
    case 'Processing': return 'pi pi-spinner'
    case 'Pending': return 'pi pi-clock'
    case 'Cancelled': return 'pi pi-times-circle'
    default: return 'pi pi-question-circle'
  }
}

const getPaymentStatusSeverity = (status: string) => {
  switch (status) {
    case 'Paid': return 'success'
    case 'Partial': return 'warning'
    case 'Unpaid': return 'danger'
    case 'Refunded': return 'help'
    default: return 'secondary'
  }
}

// Chart Functions
const initSpendingChart = () => {
  if (!spendingChartRef.value) return
  
  if (spendingChart) {
    spendingChart.destroy()
  }
  
  const ctx = spendingChartRef.value.getContext('2d')
  if (!ctx) return
  
  const monthlyData = chartYear.value === '2025' ? spendingData2025 : spendingData2026
  
  spendingChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        label: `Monthly Spending ${chartYear.value}`,
        data: monthlyData,
        backgroundColor: chartYear.value === '2025' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.8)',
        borderColor: chartYear.value === '2025' ? 'rgb(239, 68, 68)' : 'rgb(16, 185, 129)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₱' + (Number(value) / 1000).toFixed(0) + 'K'
            }
          }
        }
      }
    }
  })
}

// Spending data for charts
const spendingData2025 = [125000, 85000, 75000, 150000, 45000, 68000, 0, 0, 0, 0, 0, 0]
const spendingData2026 = [185000, 95000, 120000, 75000, 105000, 140000, 0, 0, 0, 0, 0, 0]

// Action Functions
const setYearFilter = (year: string) => {
  selectedYear.value = year
}

const setChartYear = (year: string) => {
  chartYear.value = year
  initSpendingChart()
}

const viewPurchase = (purchase: any) => {
  selectedPurchase.value = purchase
  showPurchaseDialog.value = true
}

const viewInvoice = (purchase: any) => {
  console.log('View invoice for:', purchase)
}

const trackDelivery = (purchase: any) => {
  console.log('Track delivery for:', purchase)
}

const printPurchaseOrder = (purchase: any) => {
  console.log('Print PO for:', purchase)
}

const markAsReceived = (purchase: any) => {
  if (purchase) {
    const allPurchases = [...purchaseOrders2025.value, ...purchaseOrders2026.value]
    const purchaseIndex = allPurchases.findIndex(p => p.id === purchase.id)
    if (purchaseIndex !== -1) {
      allPurchases[purchaseIndex].status = 'Completed'
      allPurchases[purchaseIndex].paymentStatus = 'Paid'
    }
  }
  showPurchaseDialog.value = false
}

const addPurchaseItem = () => {
  newPurchase.value.items.push({
    id: newPurchase.value.items.length + 1,
    productId: null,
    quantity: 1,
    unitPrice: 0
  })
}

const removePurchaseItem = (index: number) => {
  newPurchase.value.items.splice(index, 1)
}

const createPurchase = () => {
  const newId = Math.max(...purchaseOrders2026.value.map(p => p.id)) + 1
  const today = new Date().toISOString().split('T')[0]
  const dueDate = new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]
  
  const subtotal = newPurchase.value.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const tax = subtotal * (newPurchase.value.taxRate / 100)
  const amount = subtotal + newPurchase.value.shipping + tax
  
  const supplier = suppliers.value.find(s => s.id === newPurchase.value.supplierId)
  
  const purchase = {
    id: newId,
    purchaseId: `PO-${new Date().getFullYear()}-${String(newId).padStart(3, '0')}`,
    supplier: supplier?.name || 'New Supplier',
    supplierContact: supplier?.email || '',
    orderDate: today,
    dueDate: dueDate,
    amount: amount,
    subtotal: subtotal,
    shipping: newPurchase.value.shipping,
    tax: tax,
    itemCount: newPurchase.value.items.length,
    status: 'Pending',
    paymentStatus: 'Unpaid',
    items: newPurchase.value.items.map(item => {
      const product = products.value.find(p => p.id === item.productId)
      return {
        id: item.id,
        name: product?.name || 'Unknown Product',
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }
    })
  }
  
  purchaseOrders2026.value.unshift(purchase)
  showNewPurchaseDialog.value = false
  resetNewPurchase()
}

const resetNewPurchase = () => {
  newPurchase.value = {
    supplierId: null,
    expectedDelivery: null,
    items: [
      { id: 1, productId: null, quantity: 1, unitPrice: 0 }
    ],
    shipping: 0,
    taxRate: 12,
    notes: ''
  }
}

const exportReport = () => {
  console.log('Exporting purchase report...')
}

// Lifecycle
onMounted(() => {
  setTimeout(() => {
    initSpendingChart()
  }, 100)
})

onUnmounted(() => {
  if (spendingChart) {
    spendingChart.destroy()
  }
})
</script>