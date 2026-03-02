<template>
  <div class="space-y-4 md:space-y-6">
    <!-- Header Actions -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-gray-800">All Products</h2>
        <p class="text-xs md:text-sm text-gray-500 mt-1">Manage your furniture product catalog</p>
      </div>
      <div class="flex gap-2 md:gap-3">
        <Button label="Export" icon="pi pi-download" severity="secondary" outlined size="small" @click="exportProducts"
          :loading="exporting" class="flex-1 sm:flex-none" />
        <Button v-if="authStore.hasPermission('merchandising.products.create')" label="Add" icon="pi pi-plus" size="small"
          @click="$router.push({ name: 'merchandising.products.create' })" class="flex-1 sm:flex-none" />
      </div>
    </div>
  
    <!-- Filters Card -->
    <Card>
      <template #content>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-xs md:text-sm font-medium text-gray-700">Search</label>
            <IconField iconPosition="left">
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText v-model="filters.search" placeholder="Search products..." class="w-full text-sm"
                @input="debouncedSearch" />
            </IconField>
          </div>
  
          <div class="flex flex-col gap-2">
            <label class="text-xs md:text-sm font-medium text-gray-700">Category</label>
            <Select v-model="filters.category_id" :options="categories" optionLabel="category_name" optionValue="id"
              placeholder="All Categories" class="w-full text-sm" showClear @change="loadProducts" />
          </div>
  
          <div class="flex flex-col gap-2">
            <label class="text-xs md:text-sm font-medium text-gray-700">Status</label>
            <Select v-model="filters.status" :options="statusOptions" optionLabel="label" optionValue="value"
              placeholder="All Status" class="w-full text-sm" showClear @change="loadProducts" />
          </div>
  
          <div class="flex flex-col gap-2">
            <label class="text-xs md:text-sm font-medium text-gray-700">Stock Status</label>
            <Select v-model="filters.stock_status" :options="stockStatusOptions" optionLabel="label" optionValue="value"
              placeholder="All Stock" class="w-full text-sm" showClear @change="loadProducts" />
          </div>
        </div>
      </template>
    </Card>
  
    <!-- Loading State -->
    <div v-if="loading" class="space-y-3">
      <Skeleton v-for="i in 5" :key="i" height="150px" class="rounded-lg" />
    </div>
  
    <!-- ✅ PRODUCTS LIST - Shows on BOTH Mobile and Desktop -->
    <div v-else-if="products.length > 0">
      <!-- Mobile Card View - Only visible on mobile (< lg) -->
      <div v-show="!isDesktop" class="space-y-3">
        <Card v-for="product in products" :key="product.id" class="shadow-sm hover:shadow-md transition-shadow">
          <template #content>
            <div class="flex gap-3">
              <img :src="product.images?.[0] || '/placeholder-product.png'" :alt="product.product_name"
                class="w-20 h-20 object-cover rounded-lg border border-gray-200" />
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-800 truncate">{{ product.product_name }}</h3>
                <p class="text-xs text-gray-500 mt-1">{{ product.sku }}</p>
                <div class="flex items-center gap-2 mt-2">
                  <Tag :value="product.category?.category_name || 'Uncategorized'" severity="info" class="text-xs" />
                  <Tag :value="product.stock_status" :severity="getStockSeverity(product.stock_status)" class="text-xs" />
                </div>
                <div class="flex items-center justify-between mt-3">
                  <span class="text-lg font-bold text-gray-800">${{ product.base_price }}</span>
                  <div class="flex gap-1">
                    <Button icon="pi pi-eye" text rounded severity="info" size="small" @click="viewProduct(product.id)" />
                    <Button v-if="authStore.hasPermission('merchandising.products.edit')" icon="pi pi-pencil" text rounded
                      severity="warning" size="small" @click="editProduct(product.id)" />
                    <Button v-if="authStore.hasPermission('merchandising.products.delete')" icon="pi pi-trash" text
                      rounded severity="danger" size="small" @click="confirmDelete(product)" />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
  
      <!-- Desktop Table View - Only visible on desktop (>= lg) -->
      <Card v-show="isDesktop">
        <template #content>
          <DataTable :value="products" v-model:selection="selectedProducts" dataKey="id" stripedRows showGridlines
            class="p-datatable-sm" responsiveLayout="scroll">
            <template #header>
              <div class="flex items-center justify-between">
                <span class="text-base md:text-lg font-semibold">{{ totalRecords }} Products</span>
                <div class="flex gap-2">
                  <Button v-if="selectedProducts.length > 0" :label="`Delete ₱{selectedProducts.length} selected`"
                    icon="pi pi-trash" severity="danger" outlined size="small" @click="deleteSelectedProducts"
                    :loading="deleting" />
                </div>
              </div>
            </template>
  
            <Column selectionMode="multiple" headerStyle="width: 3rem" />
  
            <Column field="image" header="Image" style="min-width: 100px">
              <template #body="{ data }">
                <img :src="data.images?.[0] || '/placeholder-product.png'" :alt="data.product_name"
                  class="w-16 h-16 object-cover rounded-lg border border-gray-200" />
              </template>
            </Column>
  
            <Column field="product_name" header="Product" sortable style="min-width: 250px">
              <template #body="{ data }">
                <div>
                  <p class="font-semibold text-gray-800">{{ data.product_name }}</p>
                  <p class="text-sm text-gray-500">SKU: {{ data.sku }}</p>
                </div>
              </template>
            </Column>
  
            <Column field="category.category_name" header="Category" sortable style="min-width: 150px">
              <template #body="{ data }">
                <Tag :value="data.category?.category_name || 'Uncategorized'" severity="info" />
              </template>
            </Column>
  
            <Column field="base_price" header="Price" sortable style="min-width: 120px">
              <template #body="{ data }">
                <span class="font-bold text-gray-800">₱{{ Number(data.base_price).toFixed(2) }}</span>
              </template>
            </Column>
  
            <Column field="stock_status" header="Stock" sortable style="min-width: 120px">
              <template #body="{ data }">
                <Tag :value="data.stock_status" :severity="getStockSeverity(data.stock_status)" />
              </template>
            </Column>
  
            <Column field="is_active" header="Status" sortable style="min-width: 120px">
              <template #body="{ data }">
                <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'danger'" />
              </template>
            </Column>
  
            <Column header="Actions" style="min-width: 150px">
              <template #body="{ data }">
                <div class="flex gap-2">
                  <Button icon="pi pi-eye" text rounded severity="info" @click="viewProduct(data.id)"
                    v-tooltip.top="'View'" />
                  <Button v-if="authStore.hasPermission('merchandising.products.edit')" icon="pi pi-pencil" text rounded
                    severity="warning" @click="editProduct(data.id)" v-tooltip.top="'Edit'" />
                  <Button v-if="authStore.hasPermission('merchandising.products.delete')" icon="pi pi-trash" text rounded
                    severity="danger" @click="confirmDelete(data)" v-tooltip.top="'Delete'" />
                </div>
              </template>
            </Column>
          </DataTable>
  
          <!-- Desktop Pagination -->
          <Paginator v-if="totalRecords > pagination.perPage" v-model:first="first" :rows="pagination.perPage"
            :totalRecords="totalRecords" :rowsPerPageOptions="[10, 25, 50]" @page="onPageChange" class="mt-4" />
        </template>
      </Card>
  
      <!-- Mobile Pagination (shown only on mobile when there are products) -->
      <div v-if="totalRecords > pagination.perPage" class="flex lg:hidden justify-center mt-4">
        <Paginator v-model:first="first" :rows="pagination.perPage" :totalRecords="totalRecords"
          :rowsPerPageOptions="[10, 25, 50]" @page="onPageChange"
          template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="{first} - {last} of {totalRecords}" />
      </div>
    </div>
  
    <!-- Empty State -->
    <Card v-else>
      <template #content>
        <div class="text-center py-12">
          <i class="pi pi-inbox text-6xl text-gray-300 mb-4"></i>
          <p class="text-gray-500 text-lg mb-2">No products found</p>
          <p class="text-gray-400 text-sm mb-6">
            {{ filters.search ? 'Try adjusting your search or filters' : 'Get started by adding your first product' }}
          </p>
          <Button v-if="authStore.hasPermission('merchandising.products.create')" label="Add Your First Product"
            icon="pi pi-plus" @click="$router.push({ name: 'merchandising.products.create' })" />
        </div>
      </template>
    </Card>
  
    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="deleteDialog" :style="{ width: '90vw', maxWidth: '450px' }" header="Confirm Delete"
      :modal="true" class="p-4">
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle text-3xl md:text-4xl text-orange-500"></i>
        <span class="text-sm md:text-base">
          Are you sure you want to delete <b>{{ productToDelete?.product_name }}</b>?
        </span>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="deleteDialog = false" size="small" />
        <Button label="Delete" severity="danger" @click="deleteProduct" :loading="deleting" size="small" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import { useToast } from 'primevue/usetoast'
import merchandisingService, { type Product } from '../../../../services/merchandising.service'
import { debounce } from 'lodash'

import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Paginator from 'primevue/paginator'
import Skeleton from 'primevue/skeleton'
import { useAuthStore } from '../../../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const loading = ref(false)
const exporting = ref(false)
const deleting = ref(false)
const products = ref<Product[]>([])
const totalRecords = ref(0)
const selectedProducts = ref<Product[]>([])
const deleteDialog = ref(false)
const productToDelete = ref<Product | null>(null)
const first = ref(0)

const pagination = ref({
  page: 1,
  perPage: 10
})

const filters = ref({
  search: '',
  category_id: null as number | null,
  status: null as string | null,
  stock_status: null as string | null
})

const categories = ref<Array<{ id: number; category_name: string }>>([])

const statusOptions = ref([
  { label: 'Active', value: true },
  { label: 'Inactive', value: false }
])

const stockStatusOptions = ref([
  { label: 'In Stock', value: 'In Stock' },
  { label: 'Low Stock', value: 'Low Stock' },
  { label: 'Out of Stock', value: 'Out of Stock' }
])

const getStockSeverity = (stockStatus: string) => {
  if (stockStatus === 'In Stock') return 'success'
  if (stockStatus === 'Low Stock') return 'warning'
  return 'danger'
}

const loadProducts = async () => {
  loading.value = true
  try {
    const response = await merchandisingService.getProducts({
      page: pagination.value.page,
      perPage: pagination.value.perPage,
      search: filters.value.search || undefined,
      category_id: filters.value.category_id || undefined,
      status: filters.value.status || undefined,
      stock_status: filters.value.stock_status || undefined
    })

    console.log('📦 Full API response:', response)

    if (response.data) {
      products.value = response.data
      totalRecords.value = response.total || 0
    } else {
      products.value = []
      totalRecords.value = 0
    }

    console.log('✅ Products loaded:', products.value.length, 'items')
  } catch (error: any) {
    console.error('❌ Failed to load products:', error)

    products.value = []
    totalRecords.value = 0

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to load products',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    categories.value = await merchandisingService.getCategories({ perPage: 1000 })
    console.log('✅ Categories loaded:', categories.value.length, 'items')
  } catch (error) {
    console.error('❌ Failed to load categories:', error)
    categories.value = []
  }
}

const debouncedSearch = debounce(() => {
  pagination.value.page = 1
  first.value = 0
  loadProducts()
}, 500)

const onPageChange = (event: any) => {
  pagination.value.page = (event.first / event.rows) + 1
  pagination.value.perPage = event.rows
  first.value = event.first
  loadProducts()
}

const viewProduct = (id: number) => {
  router.push({ name: 'merchandising.products.view', params: { id } })
}

const editProduct = (id: number) => {
  router.push({ name: 'merchandising.products.edit', params: { id } })
}

const confirmDelete = (product: Product) => {
  productToDelete.value = product
  deleteDialog.value = true
}

const deleteProduct = async () => {
  if (!productToDelete.value) return

  deleting.value = true
  try {
    await merchandisingService.deleteProduct(productToDelete.value.id)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Product deleted successfully',
      life: 3000
    })
    deleteDialog.value = false
    productToDelete.value = null
    loadProducts()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to delete product',
      life: 5000
    })
  } finally {
    deleting.value = false
  }
}

const deleteSelectedProducts = async () => {
  if (selectedProducts.value.length === 0) return

  deleting.value = true
  try {
    const ids = selectedProducts.value.map(p => p.id)
    await merchandisingService.deleteMultipleProducts(ids)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `${ids.length} products deleted successfully`,
      life: 3000
    })
    selectedProducts.value = []
    loadProducts()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to delete products',
      life: 5000
    })
  } finally {
    deleting.value = false
  }
}

const exportProducts = async () => {
  exporting.value = true
  try {
    const blob = await merchandisingService.exportProducts('csv')
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `products_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Products exported successfully',
      life: 3000
    })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to export products',
      life: 5000
    })
  } finally {
    exporting.value = false
  }
}

const isDesktop = ref(window.innerWidth >= 1024)

const checkScreenSize = () => {
  isDesktop.value = window.innerWidth >= 1024
}

onMounted(() => {
  window.addEventListener('resize', checkScreenSize)
  loadProducts()
  loadCategories()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<style scoped>
@media (max-width: 640px) {
  :deep(.p-card-content) {
    padding: 0.75rem;
  }

  :deep(.p-button-label) {
    font-size: 0.875rem;
  }
}
</style>