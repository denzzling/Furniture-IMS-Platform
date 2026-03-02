<template>
  <div class="space-y-4 md:space-y-6">
    <!-- Stats Cards -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <Skeleton v-for="i in 4" :key="i" height="120px" class="rounded-lg" />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <Card class="shadow-sm hover:shadow-md transition-shadow">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs md:text-sm text-gray-500 font-medium">Total Products</p>
              <h3 class="text-2xl md:text-3xl font-bold text-gray-800 mt-1 md:mt-2">
                {{ stats.totalProducts }}
              </h3>
              <p class="text-xs md:text-sm text-green-600 mt-1">
                <i class="pi pi-arrow-up text-xs"></i> +12% from last month
              </p>
            </div>
            <div class="bg-blue-50 p-3 md:p-4 rounded-full">
              <i class="pi pi-box text-blue-600 text-xl md:text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm hover:shadow-md transition-shadow">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs md:text-sm text-gray-500 font-medium">Total Categories</p>
              <h3 class="text-2xl md:text-3xl font-bold text-gray-800 mt-1 md:mt-2">
                {{ stats.totalCategories }}
              </h3>
              <p class="text-xs md:text-sm text-blue-600 mt-1">
                <i class="pi pi-minus text-xs"></i> No change
              </p>
            </div>
            <div class="bg-purple-50 p-3 md:p-4 rounded-full">
              <i class="pi pi-sitemap text-purple-600 text-xl md:text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm hover:shadow-md transition-shadow">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs md:text-sm text-gray-500 font-medium">Low Stock Items</p>
              <h3 class="text-2xl md:text-3xl font-bold text-gray-800 mt-1 md:mt-2">
                {{ stats.lowStockItems }}
              </h3>
              <p class="text-xs md:text-sm text-red-600 mt-1">
                <i class="pi pi-exclamation-triangle text-xs"></i> Needs attention
              </p>
            </div>
            <div class="bg-red-50 p-3 md:p-4 rounded-full">
              <i class="pi pi-exclamation-circle text-red-600 text-xl md:text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm hover:shadow-md transition-shadow">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs md:text-sm text-gray-500 font-medium">Total Value</p>
              <h3 class="text-2xl md:text-3xl font-bold text-gray-800 mt-1 md:mt-2">
                ₱{{ stats.totalValue.toLocaleString() }}
              </h3>
              <p class="text-xs md:text-sm text-green-600 mt-1">
                <i class="pi pi-arrow-up text-xs"></i> +8% from last month
              </p>
            </div>
            <div class="bg-green-50 p-3 md:p-4 rounded-full">
              <i class="pi pi-dollar text-green-600 text-xl md:text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <!-- Top Categories -->
      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <span class="text-base md:text-lg">Top Categories</span>
            <Button label="View All" text size="small" class="hidden md:inline-flex" />
          </div>
        </template>
        <template #content>
          <div v-if="loading" class="space-y-3">
            <Skeleton v-for="i in 4" :key="i" height="60px" class="rounded-lg" />
          </div>
          <div v-else class="space-y-3">
            <div 
              v-for="cat in stats.topCategories" 
              :key="cat.id" 
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <i class="pi pi-box text-blue-600"></i>
                </div>
                <div>
                  <p class="font-medium text-gray-800 text-sm md:text-base">{{ cat.name }}</p>
                  <p class="text-xs md:text-sm text-gray-500">{{ cat.count }} products</p>
                </div>
              </div>
              <Tag :value="`₱${cat.value.toLocaleString()}`" severity="success" class="text-xs md:text-sm" />
            </div>
          </div>
          <div v-if="!loading && stats.topCategories.length === 0" class="text-center py-8">
            <i class="pi pi-inbox text-4xl text-gray-300 mb-2"></i>
            <p class="text-gray-500 text-sm">No categories yet</p>
          </div>
        </template>
      </Card>

      <!-- Low Stock Alert -->
      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-2 text-base md:text-lg">
              <i class="pi pi-exclamation-triangle text-orange-500"></i>
              Low Stock Alert
            </span>
            <Tag :value="`${stats.lowStockProducts.length} Items`" severity="danger" class="text-xs md:text-sm" />
          </div>
        </template>
        <template #content>
          <div v-if="loading" class="space-y-3">
            <Skeleton v-for="i in 5" :key="i" height="60px" class="rounded-lg" />
          </div>
          <div v-else class="space-y-3 max-h-80 overflow-y-auto">
            <div 
              v-for="item in stats.lowStockProducts" 
              :key="item.id" 
              class="flex items-center justify-between p-3 border border-orange-200 bg-orange-50 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <i class="pi pi-box text-orange-600"></i>
                <div>
                  <p class="font-medium text-gray-800 text-sm md:text-base">{{ item.product_name }}</p>
                  <p class="text-xs md:text-sm text-gray-600">SKU: {{ item.sku }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold text-orange-600">{{ getTotalStock(item) }}</p>
                <p class="text-xs text-gray-500">units left</p>
              </div>
            </div>
          </div>
          <div v-if="!loading && stats.lowStockProducts.length === 0" class="text-center py-8">
            <i class="pi pi-check-circle text-4xl text-green-300 mb-2"></i>
            <p class="text-gray-500 text-sm">All products are well stocked!</p>
          </div>
        </template>
      </Card>
    </div>

    <!-- Recent Products -->
    <Card>
      <template #title>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span class="text-base md:text-lg">Recent Products</span>
          <Button 
            label="Add Product" 
            icon="pi pi-plus" 
            size="small" 
            @click="router.push({ name: 'merchandising.products.create' })"
            class="w-full sm:w-auto"
          />
        </div>
      </template>
      <template #content>
        <div v-if="loading">
          <Skeleton height="300px" class="rounded-lg" />
        </div>
        <div v-else class="overflow-x-auto">
          <DataTable 
            :value="stats.recentProducts" 
            :rows="5" 
            class="p-datatable-sm"
            responsiveLayout="scroll"
          >
            <Column field="product_name" header="Product" style="min-width: 200px">
              <template #body="{ data }">
                <div class="flex items-center gap-3">
                  <Avatar 
                    :image="getProductImage(data)" 
                    :label="data.product_name[0]" 
                    shape="circle" 
                    class="bg-blue-100 text-blue-600" 
                  />
                  <div>
                    <p class="font-medium text-sm">{{ data.product_name }}</p>
                    <p class="text-xs text-gray-500">{{ data.sku }}</p>
                  </div>
                </div>
              </template>
            </Column>
            <Column field="category.category_name" header="Category" class="hidden md:table-cell" />
            <Column field="base_price" header="Price">
              <template #body="{ data }">
                <span class="font-semibold">₱{{ formatPrice(data.base_price) }}</span>
              </template>
            </Column>
            <Column field="stock_status" header="Stock">
              <template #body="{ data }">
                <Tag 
                  :value="data.stock_status" 
                  :severity="getStockSeverity(data.stock_status)" 
                />
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import merchandisingService, { type DashboardStats, type Product } from '../../../services/merchandising.service'

import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'
import Skeleton from 'primevue/skeleton'

const router = useRouter()
const toast = useToast()

const loading = ref(true)
const stats = ref<DashboardStats>({
  totalProducts: 0,
  totalCategories: 0,
  lowStockItems: 0,
  totalValue: 0,
  topCategories: [],
  recentProducts: [],
  lowStockProducts: []
})

const getProductImage = (product: Product) => {
  if (product.assets && product.assets.length > 0) {
    const primaryAsset = product.assets.find(a => a.is_primary)
    return primaryAsset?.url || product.assets[0].url || '/placeholder-product.png'
  }
  return '/placeholder-product.png'
}

const formatPrice = (price: string | number) => {
  return Number(price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const getStockSeverity = (stockStatus: string) => {
  if (stockStatus === 'In Stock') return 'success'
  if (stockStatus === 'Low Stock') return 'warning'
  return 'danger'
}

const getTotalStock = (product: Product) => {
  if (product.variations && product.variations.length > 0) {
    return product.variations.reduce((total, v) => total + v.stock_quantity, 0)
  }
  return 0
}

const loadDashboard = async () => {
  loading.value = true
  try {
    stats.value = await merchandisingService.getDashboardStats()
  } catch (error: any) {
    console.error('Failed to load dashboard:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to load dashboard data',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboard()
})
</script>