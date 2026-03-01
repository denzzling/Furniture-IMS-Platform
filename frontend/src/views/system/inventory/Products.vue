<!-- views/system/Products.vue -->
<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white shadow rounded-xl p-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Products</h1>
          <p class="text-gray-600 mt-2">Manage your furniture product catalog and inventory</p>
        </div>
        <div class="flex space-x-2">
          <Button 
            label="New Product" 
            icon="pi pi-plus" 
            @click="showNewProductDialog = true"
          />
          <Button 
            label="Export Catalog" 
            icon="pi pi-download" 
            severity="secondary"
            @click="exportCatalog"
          />
          <Button 
            label="Quick Import" 
            icon="pi pi-upload" 
            severity="secondary"
            @click="showImportDialog = true"
          />
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white shadow rounded-xl p-6">
        <div class="flex items-center justify-between">
          <h6 class="text-sm font-semibold text-gray-500">Total Products</h6>
          <i class="pi pi-box text-blue-500 text-lg"></i>
        </div>
        <p class="text-2xl font-bold text-gray-800 mt-2">{{ totalProducts }}</p>
        <p class="text-sm text-green-500">+12 new this month</p>
      </div>

      <div class="bg-white shadow rounded-xl p-6">
        <div class="flex items-center justify-between">
          <h6 class="text-sm font-semibold text-gray-500">Low Stock</h6>
          <i class="pi pi-exclamation-triangle text-yellow-500 text-lg"></i>
        </div>
        <p class="text-2xl font-bold text-gray-800 mt-2">{{ lowStockCount }}</p>
        <p class="text-sm text-yellow-500">Need restocking</p>
      </div>

      <div class="bg-white shadow rounded-xl p-6">
        <div class="flex items-center justify-between">
          <h6 class="text-sm font-semibold text-gray-500">Out of Stock</h6>
          <i class="pi pi-times-circle text-red-500 text-lg"></i>
        </div>
        <p class="text-2xl font-bold text-gray-800 mt-2">{{ outOfStockCount }}</p>
        <p class="text-sm text-red-500">Urgent attention</p>
      </div>

      <div class="bg-white shadow rounded-xl p-6">
        <div class="flex items-center justify-between">
          <h6 class="text-sm font-semibold text-gray-500">Total Value</h6>
          <i class="pi pi-money-bill text-green-500 text-lg"></i>
        </div>
        <p class="text-2xl font-bold text-gray-800 mt-2">₱{{ formatCurrency(totalInventoryValue) }}</p>
        <p class="text-sm text-green-500">Inventory worth</p>
      </div>
    </div>

    <!-- Filters and Actions -->
    <div class="bg-white shadow rounded-xl p-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center space-x-4">
          <div class="w-64">
            <IconField>
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText 
                v-model="searchTerm" 
                placeholder="Search products..." 
                class="w-full"
              />
            </IconField>
          </div>
          <div>
            <Select 
              v-model="selectedCategory" 
              :options="categories" 
              optionLabel="name" 
              placeholder="All Categories"
              class="w-48"
            />
          </div>
          <div>
            <Select 
              v-model="selectedStatus" 
              :options="stockStatusOptions" 
              optionLabel="name" 
              placeholder="All Status"
              class="w-48"
            />
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <Button 
            label="Apply Filters" 
            size="small"
            @click="applyFilters"
          />
          <Button 
            label="Clear" 
            severity="secondary" 
            size="small"
            @click="clearFilters"
          />
          <Button 
            icon="pi pi-filter" 
            severity="secondary" 
            @click="showAdvancedFilters = !showAdvancedFilters"
          />
        </div>
      </div>

      <!-- Advanced Filters -->
      <div v-if="showAdvancedFilters" class="mt-4 p-4 bg-gray-50 rounded-lg">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
            <div class="flex items-center space-x-2">
              <InputNumber 
                v-model="priceRange.min" 
                placeholder="Min" 
                mode="currency" 
                currency="PHP" 
                locale="en-PH"
                class="w-full"
              />
              <span class="text-gray-400">to</span>
              <InputNumber 
                v-model="priceRange.max" 
                placeholder="Max" 
                mode="currency" 
                currency="PHP" 
                locale="en-PH"
                class="w-full"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Stock Range</label>
            <div class="flex items-center space-x-2">
              <InputNumber 
                v-model="stockRange.min" 
                placeholder="Min" 
                :min="0"
                class="w-full"
              />
              <span class="text-gray-400">to</span>
              <InputNumber 
                v-model="stockRange.max" 
                placeholder="Max" 
                :min="0"
                class="w-full"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
            <div class="flex items-center space-x-2">
              <DatePicker 
                v-model="dateRange.start" 
                placeholder="From" 
                showIcon
                dateFormat="yy-mm-dd"
                class="flex-1"
              />
              <DatePicker 
                v-model="dateRange.end" 
                placeholder="To" 
                showIcon
                dateFormat="yy-mm-dd"
                class="flex-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Products Table -->
    <div class="bg-white shadow rounded-xl p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-semibold text-gray-800">Product Catalog</h3>
        <div class="text-sm text-gray-500">
          Showing {{ filteredProducts.length }} of {{ products.length }} products
        </div>
      </div>

      <DataTable 
        :value="filteredProducts"
        v-model:selection="selectedProducts"
        dataKey="id"
        sortMode="multiple" 
        tableStyle="min-width: 50rem"
        paginator
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
        :loading="loading"
      >
        <!-- Checkbox Column -->
        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

        <!-- Product Image & Name -->
        <Column field="name" header="Product" sortable style="width: 25%">
          <template #body="slotProps">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  v-if="slotProps.data.image" 
                  :src="slotProps.data.image" 
                  :alt="slotProps.data.name"
                  class="w-full h-full object-cover"
                />
                <i v-else class="pi pi-image text-gray-400"></i>
              </div>
              <div>
                <p class="font-medium text-gray-800">{{ slotProps.data.name }}</p>
                <p class="text-xs text-gray-500">{{ slotProps.data.sku }}</p>
                <p class="text-xs text-gray-500">{{ slotProps.data.category }}</p>
              </div>
            </div>
          </template>
        </Column>

        <!-- Price -->
        <Column field="price" header="Price" sortable style="width: 12%">
          <template #body="slotProps">
            <div class="text-right">
              <p class="font-bold">₱{{ formatCurrency(slotProps.data.price) }}</p>
              <p class="text-xs text-gray-500">Cost: ₱{{ formatCurrency(slotProps.data.cost) }}</p>
            </div>
          </template>
        </Column>

        <!-- Stock -->
        <Column field="stock" header="Stock" sortable style="width: 15%">
          <template #body="slotProps">
            <div class="flex items-center">
              <div class="flex-1">
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-medium">{{ slotProps.data.stock }}</span>
                  <span class="text-gray-500">/ {{ slotProps.data.maxStock }}</span>
                </div>
                <ProgressBar 
                  :value="(slotProps.data.stock / slotProps.data.maxStock) * 100" 
                  :showValue="false"
                  :class="getStockProgressClass(slotProps.data.stock, slotProps.data.maxStock)"
                  style="height: 6px"
                />
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Min: {{ slotProps.data.minStock }}</span>
                  <span :class="getStockStatusClass(slotProps.data.stock, slotProps.data.minStock)">
                    {{ getStockStatus(slotProps.data.stock, slotProps.data.minStock) }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </Column>

        <!-- Category -->
        <Column field="category" header="Category" sortable style="width: 12%">
          <template #body="slotProps">
            <Tag 
              :value="slotProps.data.category" 
              severity="info"
              rounded
            />
          </template>
        </Column>

        <!-- Status -->
        <Column field="status" header="Status" sortable style="width: 10%">
          <template #body="slotProps">
            <Tag 
              :value="slotProps.data.status" 
              :severity="getProductStatusSeverity(slotProps.data.status)"
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
                @click="viewProduct(slotProps.data)"
              />
              <Button 
                icon="pi pi-pencil" 
                size="small" 
                text 
                rounded
                severity="secondary"
                @click="editProduct(slotProps.data)"
              />
              <Button 
                icon="pi pi-box" 
                size="small" 
                text 
                rounded
                severity="help"
                @click="manageStock(slotProps.data)"
              />
              <Button 
                icon="pi pi-chart-bar" 
                size="small" 
                text 
                rounded
                severity="success"
                @click="viewAnalytics(slotProps.data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Product Statistics -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Stock Distribution -->
      <div class="bg-white shadow rounded-xl p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Stock Distribution by Category</h3>
        <div class="h-72">
          <canvas ref="stockChartRef"></canvas>
        </div>
      </div>

      <!-- Top Products -->
      <div class="bg-white shadow rounded-xl p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Top Performing Products</h3>
        <div class="space-y-3">
          <div v-for="product in topProducts" :key="product.id"
            class="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                <i class="pi pi-box text-blue-600"></i>
              </div>
              <div>
                <p class="font-medium">{{ product.name }}</p>
                <p class="text-sm text-gray-500">{{ product.category }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-bold">₱{{ formatCurrency(product.revenue) }}</p>
              <p class="text-sm text-gray-500">{{ product.sold }} sold</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Details Dialog -->
    <Dialog 
      v-model:visible="showProductDialog" 
      :header="selectedProduct ? selectedProduct.name : 'Product Details'"
      :style="{ width: '800px' }"
    >
      <div v-if="selectedProduct" class="space-y-6">
        <!-- Product Header -->
        <div class="flex space-x-4">
          <div class="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            <img 
              v-if="selectedProduct.image" 
              :src="selectedProduct.image" 
              :alt="selectedProduct.name"
              class="w-full h-full object-cover"
            />
            <i v-else class="pi pi-image text-gray-400 text-4xl"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-gray-800">{{ selectedProduct.name }}</h3>
            <p class="text-gray-600">{{ selectedProduct.description }}</p>
            <div class="flex items-center space-x-2 mt-2">
              <Tag :value="selectedProduct.category" severity="info" />
              <Tag :value="selectedProduct.status" :severity="getProductStatusSeverity(selectedProduct.status)" />
              <Tag :value="selectedProduct.sku" severity="secondary" />
            </div>
          </div>
        </div>

        <!-- Product Details -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-sm text-gray-500">Pricing</p>
            <div class="space-y-2 mt-2">
              <div class="flex justify-between">
                <span>Selling Price:</span>
                <span class="font-bold">₱{{ formatCurrency(selectedProduct.price) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Cost Price:</span>
                <span>₱{{ formatCurrency(selectedProduct.cost) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Profit Margin:</span>
                <span class="text-green-600 font-medium">{{ calculateProfitMargin(selectedProduct) }}%</span>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-sm text-gray-500">Stock Information</p>
            <div class="space-y-2 mt-2">
              <div class="flex justify-between">
                <span>Current Stock:</span>
                <span class="font-bold">{{ selectedProduct.stock }}</span>
              </div>
              <div class="flex justify-between">
                <span>Min Stock:</span>
                <span>{{ selectedProduct.minStock }}</span>
              </div>
              <div class="flex justify-between">
                <span>Max Stock:</span>
                <span>{{ selectedProduct.maxStock }}</span>
              </div>
              <div class="flex justify-between">
                <span>Reorder Point:</span>
                <span :class="getStockStatusClass(selectedProduct.stock, selectedProduct.minStock)">
                  {{ selectedProduct.stock <= selectedProduct.minStock ? 'Reorder Now' : 'Adequate' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Product Specifications -->
        <div v-if="selectedProduct.specifications">
          <h4 class="font-medium text-gray-800 mb-2">Specifications</h4>
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="grid grid-cols-2 gap-3">
              <div v-for="(value, key) in selectedProduct.specifications" :key="key" class="flex justify-between">
                <span class="text-gray-600">{{ formatSpecKey(key) }}:</span>
                <span class="font-medium">{{ value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sales Performance -->
        <div v-if="selectedProduct.salesData">
          <h4 class="font-medium text-gray-800 mb-2">Sales Performance</h4>
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="grid grid-cols-3 gap-4">
              <div class="text-center">
                <p class="text-sm text-gray-500">Monthly Sales</p>
                <p class="text-2xl font-bold">{{ selectedProduct.salesData.monthlySales }}</p>
              </div>
              <div class="text-center">
                <p class="text-sm text-gray-500">Total Revenue</p>
                <p class="text-2xl font-bold">₱{{ formatCurrency(selectedProduct.salesData.totalRevenue) }}</p>
              </div>
              <div class="text-center">
                <p class="text-sm text-gray-500">Avg. Monthly</p>
                <p class="text-2xl font-bold">₱{{ formatCurrency(selectedProduct.salesData.averageMonthlyRevenue) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Close" severity="secondary" @click="showProductDialog = false" />
        <Button label="Edit Product" icon="pi pi-pencil" @click="editProduct(selectedProduct)" />
        <Button label="Update Stock" icon="pi pi-box" @click="manageStock(selectedProduct)" />
      </template>
    </Dialog>

    <!-- New Product Dialog -->
    <Dialog 
      v-model:visible="showNewProductDialog" 
      header="Add New Product"
      :style="{ width: '900px' }"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <InputText 
              v-model="newProduct.name" 
              placeholder="Enter product name" 
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
            <InputText 
              v-model="newProduct.sku" 
              placeholder="Enter SKU" 
              class="w-full"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <Textarea 
            v-model="newProduct.description" 
            placeholder="Enter product description" 
            rows="3"
            class="w-full"
          />
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <Select 
              v-model="newProduct.category" 
              :options="categories" 
              optionLabel="name" 
              placeholder="Select category"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Price *</label>
            <InputNumber 
              v-model="newProduct.price" 
              mode="currency" 
              currency="PHP" 
              locale="en-PH"
              placeholder="Selling price"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Cost *</label>
            <InputNumber 
              v-model="newProduct.cost" 
              mode="currency" 
              currency="PHP" 
              locale="en-PH"
              placeholder="Cost price"
              class="w-full"
            />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Initial Stock *</label>
            <InputNumber 
              v-model="newProduct.stock" 
              :min="0"
              placeholder="Initial quantity"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
            <InputNumber 
              v-model="newProduct.minStock" 
              :min="0"
              placeholder="Minimum stock"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Max Stock</label>
            <InputNumber 
              v-model="newProduct.maxStock" 
              :min="0"
              placeholder="Maximum stock"
              class="w-full"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Product Image URL</label>
          <InputText 
            v-model="newProduct.image" 
            placeholder="https://example.com/image.jpg" 
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
          <div class="space-y-2">
            <div class="flex space-x-2" v-for="(spec, index) in newProduct.specifications" :key="index">
              <InputText 
                v-model="spec.key" 
                placeholder="Key (e.g., Dimensions)" 
                class="flex-1"
              />
              <InputText 
                v-model="spec.value" 
                placeholder="Value (e.g., 200x100x80 cm)" 
                class="flex-1"
              />
              <Button 
                icon="pi pi-trash" 
                severity="danger" 
                @click="removeSpecification(index)"
              />
            </div>
            <Button 
              label="Add Specification" 
              icon="pi pi-plus" 
              size="small"
              @click="addSpecification"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" severity="secondary" @click="showNewProductDialog = false" />
        <Button label="Create Product" @click="createProduct" :disabled="!isValidNewProduct" />
      </template>
    </Dialog>

    <!-- Import Dialog -->
    <Dialog 
      v-model:visible="showImportDialog" 
      header="Import Products"
      :style="{ width: '500px' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Import Method</label>
          <Select 
            v-model="importMethod" 
            :options="importOptions" 
            optionLabel="name" 
            placeholder="Select method"
            class="w-full"
          />
        </div>

        <div v-if="importMethod?.value === 'csv'">
          <label class="block text-sm font-medium text-gray-700 mb-1">Upload CSV File</label>
          <FileUpload 
            mode="basic" 
            chooseLabel="Choose CSV File" 
            accept=".csv"
            :maxFileSize="1000000"
            @select="onFileSelect"
          />
          <p class="text-xs text-gray-500 mt-2">Supported columns: Name, SKU, Category, Price, Cost, Stock</p>
        </div>

        <div v-if="importMethod?.value === 'manual'">
          <label class="block text-sm font-medium text-gray-700 mb-1">Paste Data (CSV format)</label>
          <Textarea 
            v-model="importData" 
            placeholder="Paste CSV data here..." 
            rows="5"
            class="w-full"
          />
        </div>

        <div class="bg-blue-50 p-4 rounded-lg">
          <p class="text-sm text-blue-800">
            <i class="pi pi-info-circle mr-2"></i>
            Import will add new products. Existing products will not be updated.
          </p>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" severity="secondary" @click="showImportDialog = false" />
        <Button label="Import" @click="importProducts" :disabled="!canImport" />
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
import Select from 'primevue/select'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import ProgressBar from 'primevue/progressbar'
import DatePicker from 'primevue/datepicker'
import FileUpload from 'primevue/fileupload'

// Register Chart.js
Chart.register(...registerables)

// Chart refs
const stockChartRef = ref<HTMLCanvasElement | null>(null)
let stockChart: Chart | null = null

// State
const loading = ref(false)
const showProductDialog = ref(false)
const showNewProductDialog = ref(false)
const showImportDialog = ref(false)
const showAdvancedFilters = ref(false)
const searchTerm = ref('')
const selectedCategory = ref(null)
const selectedStatus = ref(null)
const selectedProducts = ref<any[]>([])
const selectedProduct = ref<any>(null)
const importMethod = ref<any>(null)
const importData = ref('')

// Filters
const priceRange = ref({ min: null, max: null })
const stockRange = ref({ min: null, max: null })
const dateRange = ref({
  start: null,
  end: null
})

// New Product
const newProduct = ref({
  name: '',
  sku: '',
  description: '',
  category: null,
  price: 0,
  cost: 0,
  stock: 0,
  minStock: 10,
  maxStock: 100,
  image: '',
  specifications: [
    { key: 'Material', value: '' },
    { key: 'Dimensions', value: '' },
    { key: 'Weight', value: '' },
    { key: 'Color', value: '' }
  ]
})

// Product Data
const products = ref([
  {
    id: 1,
    sku: 'FUR-SOF-001',
    name: 'Modern Leather Sofa',
    description: 'Contemporary 3-seater leather sofa with wooden legs',
    category: 'Living Room',
    price: 35000,
    cost: 22000,
    stock: 25,
    minStock: 5,
    maxStock: 50,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    specifications: {
      material: 'Genuine Leather',
      dimensions: '220x90x85 cm',
      weight: '85 kg',
      color: 'Black',
      warranty: '2 years'
    },
    salesData: {
      monthlySales: 12,
      totalRevenue: 420000,
      averageMonthlyRevenue: 35000
    },
    createdAt: '2024-01-15'
  },
  {
    id: 2,
    sku: 'FUR-DIN-001',
    name: 'Oak Dining Table',
    description: 'Solid oak dining table with extension leaf',
    category: 'Dining Room',
    price: 28000,
    cost: 18000,
    stock: 15,
    minStock: 3,
    maxStock: 30,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w-400',
    specifications: {
      material: 'Solid Oak',
      dimensions: '180x90x75 cm',
      weight: '65 kg',
      color: 'Natural Oak',
      warranty: '3 years'
    },
    salesData: {
      monthlySales: 8,
      totalRevenue: 224000,
      averageMonthlyRevenue: 28000
    },
    createdAt: '2024-02-10'
  },
  {
    id: 3,
    sku: 'FUR-BED-001',
    name: 'King Size Bed Frame',
    description: 'Upholstered king size bed with storage',
    category: 'Bedroom',
    price: 45000,
    cost: 30000,
    stock: 8,
    minStock: 2,
    maxStock: 20,
    status: 'Low Stock',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400',
    specifications: {
      material: 'Fabric, Wood',
      dimensions: '210x200x120 cm',
      weight: '120 kg',
      color: 'Charcoal Gray',
      warranty: '5 years'
    },
    salesData: {
      monthlySales: 5,
      totalRevenue: 225000,
      averageMonthlyRevenue: 45000
    },
    createdAt: '2024-01-25'
  },
  {
    id: 4,
    sku: 'FUR-OFF-001',
    name: 'Ergonomic Office Chair',
    description: 'Executive office chair with lumbar support',
    category: 'Office',
    price: 12500,
    cost: 8000,
    stock: 42,
    minStock: 10,
    maxStock: 100,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    specifications: {
      material: 'Mesh, Aluminum',
      dimensions: '65x65x120 cm',
      weight: '25 kg',
      color: 'Black',
      warranty: '1 year'
    },
    salesData: {
      monthlySales: 25,
      totalRevenue: 312500,
      averageMonthlyRevenue: 12500
    },
    createdAt: '2024-03-05'
  },
  {
    id: 5,
    sku: 'FUR-STU-001',
    name: 'Wall Bookshelf',
    description: 'Modern wall-mounted bookshelf with LED lighting',
    category: 'Study',
    price: 18000,
    cost: 12000,
    stock: 0,
    minStock: 5,
    maxStock: 25,
    status: 'Out of Stock',
    image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400',
    specifications: {
      material: 'Plywood, Metal',
      dimensions: '200x40x180 cm',
      weight: '35 kg',
      color: 'White',
      warranty: '2 years'
    },
    salesData: {
      monthlySales: 15,
      totalRevenue: 270000,
      averageMonthlyRevenue: 18000
    },
    createdAt: '2024-02-20'
  },
  {
    id: 6,
    sku: 'FUR-OUT-001',
    name: 'Patio Dining Set',
    description: '6-piece outdoor dining set with cushions',
    category: 'Outdoor',
    price: 55000,
    cost: 38000,
    stock: 6,
    minStock: 2,
    maxStock: 15,
    status: 'Low Stock',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400',
    specifications: {
      material: 'Rattan, Glass',
      dimensions: 'Table: 150x90x75 cm',
      weight: '95 kg',
      color: 'Brown',
      warranty: '2 years'
    },
    salesData: {
      monthlySales: 4,
      totalRevenue: 220000,
      averageMonthlyRevenue: 55000
    },
    createdAt: '2024-03-15'
  },
  {
    id: 7,
    sku: 'FUR-ACC-001',
    name: 'Decorative Floor Lamp',
    description: 'Modern tripod floor lamp with dimmable LED',
    category: 'Lighting',
    price: 8500,
    cost: 5500,
    stock: 35,
    minStock: 15,
    maxStock: 80,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
    specifications: {
      material: 'Metal, Fabric',
      dimensions: '180x50x50 cm',
      weight: '12 kg',
      color: 'Gold',
      warranty: '1 year'
    },
    salesData: {
      monthlySales: 20,
      totalRevenue: 170000,
      averageMonthlyRevenue: 8500
    },
    createdAt: '2024-01-30'
  },
  {
    id: 8,
    sku: 'FUR-STO-001',
    name: 'TV Console Cabinet',
    description: 'Minimalist TV console with storage drawers',
    category: 'Storage',
    price: 22000,
    cost: 15000,
    stock: 18,
    minStock: 5,
    maxStock: 40,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400',
    specifications: {
      material: 'MDF, Metal',
      dimensions: '180x45x50 cm',
      weight: '45 kg',
      color: 'Walnut',
      warranty: '2 years'
    },
    salesData: {
      monthlySales: 10,
      totalRevenue: 220000,
      averageMonthlyRevenue: 22000
    },
    createdAt: '2024-02-28'
  },
  {
    id: 9,
    sku: 'FUR-KID-001',
    name: 'Kids Study Desk',
    description: 'Adjustable height study desk for children',
    category: 'Kids',
    price: 15000,
    cost: 10000,
    stock: 12,
    minStock: 5,
    maxStock: 30,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    specifications: {
      material: 'Plastic, Metal',
      dimensions: '100x60x75 cm',
      weight: '22 kg',
      color: 'Blue',
      warranty: '3 years'
    },
    salesData: {
      monthlySales: 8,
      totalRevenue: 120000,
      averageMonthlyRevenue: 15000
    },
    createdAt: '2024-03-10'
  },
  {
    id: 10,
    sku: 'FUR-BAR-001',
    name: 'Home Bar Cabinet',
    description: 'Glass front bar cabinet with wine rack',
    category: 'Bar',
    price: 32000,
    cost: 22000,
    stock: 4,
    minStock: 2,
    maxStock: 10,
    status: 'Low Stock',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    specifications: {
      material: 'Wood, Glass',
      dimensions: '120x50x180 cm',
      weight: '75 kg',
      color: 'Espresso',
      warranty: '2 years'
    },
    salesData: {
      monthlySales: 3,
      totalRevenue: 96000,
      averageMonthlyRevenue: 32000
    },
    createdAt: '2024-02-15'
  }
])

// Categories
const categories = ref([
  { name: 'Living Room', value: 'living-room' },
  { name: 'Dining Room', value: 'dining-room' },
  { name: 'Bedroom', value: 'bedroom' },
  { name: 'Office', value: 'office' },
  { name: 'Study', value: 'study' },
  { name: 'Outdoor', value: 'outdoor' },
  { name: 'Lighting', value: 'lighting' },
  { name: 'Storage', value: 'storage' },
  { name: 'Kids', value: 'kids' },
  { name: 'Bar', value: 'bar' }
])

// Stock Status Options
const stockStatusOptions = ref([
  { name: 'In Stock', value: 'in-stock' },
  { name: 'Low Stock', value: 'low-stock' },
  { name: 'Out of Stock', value: 'out-of-stock' }
])

// Import Options
const importOptions = ref([
  { name: 'CSV File Upload', value: 'csv' },
  { name: 'Manual Entry (CSV)', value: 'manual' },
  { name: 'Excel File', value: 'excel' }
])

// Top Products for analytics
const topProducts = computed(() => {
  return [...products.value]
    .sort((a, b) => (b.salesData?.totalRevenue || 0) - (a.salesData?.totalRevenue || 0))
    .slice(0, 5)
    .map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      revenue: p.salesData?.totalRevenue || 0,
      sold: p.salesData?.monthlySales || 0
    }))
})

// Computed Properties
const filteredProducts = computed(() => {
  let filtered = [...products.value]
  
  // Search filter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.name?.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term)
    )
  }
  
  // Category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(p => p.category === selectedCategory.value.name)
  }
  
  // Status filter
  if (selectedStatus.value) {
    filtered = filtered.filter(p => p.status === selectedStatus.value.name)
  }
  
  // Price range filter
  if (priceRange.value.min !== null) {
    filtered = filtered.filter(p => p.price >= priceRange.value.min)
  }
  if (priceRange.value.max !== null) {
    filtered = filtered.filter(p => p.price <= priceRange.value.max)
  }
  
  // Stock range filter
  if (stockRange.value.min !== null) {
    filtered = filtered.filter(p => p.stock >= stockRange.value.min)
  }
  if (stockRange.value.max !== null) {
    filtered = filtered.filter(p => p.stock <= stockRange.value.max)
  }
  
  // Date range filter
  if (dateRange.value.start && dateRange.value.end) {
    const start = new Date(dateRange.value.start)
    const end = new Date(dateRange.value.end)
    
    filtered = filtered.filter(p => {
      try {
        const created = new Date(p.createdAt)
        return created >= start && created <= end
      } catch (e) {
        return true
      }
    })
  }
  
  return filtered
})

const totalProducts = computed(() => products.value.length)

const lowStockCount = computed(() => {
  return products.value.filter(p => p.status === 'Low Stock').length
})

const outOfStockCount = computed(() => {
  return products.value.filter(p => p.status === 'Out of Stock').length
})

const totalInventoryValue = computed(() => {
  return products.value.reduce((sum, p) => sum + (p.stock * p.cost), 0)
})

const isValidNewProduct = computed(() => {
  return newProduct.value.name && 
         newProduct.value.sku && 
         newProduct.value.category && 
         newProduct.value.price > 0 &&
         newProduct.value.cost > 0
})

const canImport = computed(() => {
  if (importMethod.value?.value === 'csv') {
    // Check if file is selected (you'll need to implement file handling)
    return true
  }
  if (importMethod.value?.value === 'manual') {
    return importData.value.trim().length > 0
  }
  return false
})

// Helper Functions
const formatCurrency = (amount: number) => {
  return amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const getProductStatusSeverity = (status: string) => {
  switch (status) {
    case 'In Stock': return 'success'
    case 'Low Stock': return 'warning'
    case 'Out of Stock': return 'danger'
    default: return 'secondary'
  }
}

const getStockProgressClass = (stock: number, maxStock: number) => {
  const percentage = (stock / maxStock) * 100
  if (percentage <= 20) return '!bg-red-500'
  if (percentage <= 50) return '!bg-yellow-500'
  return '!bg-green-500'
}

const getStockStatus = (stock: number, minStock: number) => {
  if (stock === 0) return 'Out of Stock'
  if (stock <= minStock) return 'Low Stock'
  if (stock > minStock * 2) return 'High Stock'
  return 'Adequate'
}

const getStockStatusClass = (stock: number, minStock: number) => {
  if (stock === 0) return 'text-red-600 font-medium'
  if (stock <= minStock) return 'text-yellow-600 font-medium'
  return 'text-green-600 font-medium'
}

const calculateProfitMargin = (product: any) => {
  if (!product.price || !product.cost) return 0
  const margin = ((product.price - product.cost) / product.price) * 100
  return Math.round(margin * 10) / 10
}

const formatSpecKey = (key: string) => {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
}

// Chart Functions
const initStockChart = () => {
  if (!stockChartRef.value) return
  
  if (stockChart) {
    stockChart.destroy()
  }
  
  const ctx = stockChartRef.value.getContext('2d')
  if (!ctx) return
  
  // Calculate stock by category
  const categoryStock = new Map()
  products.value.forEach(product => {
    if (!categoryStock.has(product.category)) {
      categoryStock.set(product.category, 0)
    }
    categoryStock.set(product.category, categoryStock.get(product.category) + product.stock)
  })
  
  const labels = Array.from(categoryStock.keys())
  const data = Array.from(categoryStock.values())
  
  // Colors for different categories
  const colors = [
    'rgba(79, 70, 229, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(20, 184, 166, 0.8)'
  ]
  
  stockChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: 'white',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            padding: 20
          }
        }
      }
    }
  })
}

// Action Functions
const applyFilters = () => {
  console.log('Filters applied')
}

const clearFilters = () => {
  searchTerm.value = ''
  selectedCategory.value = null
  selectedStatus.value = null
  priceRange.value = { min: null, max: null }
  stockRange.value = { min: null, max: null }
  dateRange.value = { start: null, end: null }
}

const viewProduct = (product: any) => {
  selectedProduct.value = product
  showProductDialog.value = true
}

const editProduct = (product: any) => {
  console.log('Edit product:', product)
  // Navigate to edit page or open edit dialog
}

const manageStock = (product: any) => {
  console.log('Manage stock for:', product)
  // Open stock management dialog
}

const viewAnalytics = (product: any) => {
  console.log('View analytics for:', product)
  // Navigate to analytics page
}

const addSpecification = () => {
  newProduct.value.specifications.push({ key: '', value: '' })
}

const removeSpecification = (index: number) => {
  newProduct.value.specifications.splice(index, 1)
}

const createProduct = () => {
  const newId = Math.max(...products.value.map(p => p.id)) + 1
  const today = new Date().toISOString().split('T')[0]
  
  // Convert specifications array to object
  const specifications: any = {}
  newProduct.value.specifications.forEach(spec => {
    if (spec.key && spec.value) {
      specifications[spec.key.toLowerCase().replace(/ /g, '_')] = spec.value
    }
  })
  
  // Determine stock status
  let status = 'In Stock'
  if (newProduct.value.stock === 0) {
    status = 'Out of Stock'
  } else if (newProduct.value.stock <= newProduct.value.minStock) {
    status = 'Low Stock'
  }
  
  const product = {
    id: newId,
    sku: newProduct.value.sku,
    name: newProduct.value.name,
    description: newProduct.value.description,
    category: newProduct.value.category?.name || '',
    price: newProduct.value.price,
    cost: newProduct.value.cost,
    stock: newProduct.value.stock,
    minStock: newProduct.value.minStock,
    maxStock: newProduct.value.maxStock,
    status: status,
    image: newProduct.value.image,
    specifications: specifications,
    salesData: {
      monthlySales: 0,
      totalRevenue: 0,
      averageMonthlyRevenue: 0
    },
    createdAt: today
  }
  
  products.value.unshift(product)
  showNewProductDialog.value = false
  resetNewProduct()
}

const resetNewProduct = () => {
  newProduct.value = {
    name: '',
    sku: '',
    description: '',
    category: null,
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 10,
    maxStock: 100,
    image: '',
    specifications: [
      { key: 'Material', value: '' },
      { key: 'Dimensions', value: '' },
      { key: 'Weight', value: '' },
      { key: 'Color', value: '' }
    ]
  }
}

const onFileSelect = (event: any) => {
  console.log('File selected:', event)
  // Handle file upload logic
}

const importProducts = () => {
  console.log('Importing products...')
  showImportDialog.value = false
  // Implement import logic
}

const exportCatalog = () => {
  console.log('Exporting catalog...')
  // Implement export logic
}

// Lifecycle
onMounted(() => {
  setTimeout(() => {
    initStockChart()
  }, 100)
})

onUnmounted(() => {
  if (stockChart) {
    stockChart.destroy()
  }
})
</script>