<template>
  <div class="bg-gray-50 min-h-screen">
    <Card class="mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Branch Info (Display Only) -->
          <div class="flex items-center gap-2 bg-gray-100 p-3 rounded-lg">
            <i class="pi pi-building text-blue-500"></i>
            <span class="font-medium">Branch:</span>
            <span>{{ currentBranchName || 'Loading...' }}</span>
          </div>

          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText 
              v-model="filters.search" 
              placeholder="Search item name or SKU" 
              class="w-full" 
              @input="onFilterChange" 
            />
          </IconField>

          <Select
            v-model="filters.stock_status"
            :options="stockStatuses"
            optionLabel="label"
            optionValue="value"
            placeholder="Stock Status"
            class="w-full"
            showClear
            @change="onFilterChange"
          />
        </div>
        
        <!-- Reset Button -->
        <div class="mt-4 flex justify-end">
          <Button icon="pi pi-filter-slash" label="Reset Filters" severity="secondary" outlined @click="resetFilters" />
        </div>
      </template>
    </Card>

    <Card>
      <template #content>
        <DataTable
          :value="items"
          :loading="loading"
          paginator
          :rows="filters.per_page"
          :totalRecords="totalRecords"
          :lazy="true"
          @page="onPage"
          dataKey="id"
          :rowsPerPageOptions="[15, 25, 50]"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          class="p-datatable-sm"
          stripedRows
        >
          <template #empty>
            <div class="text-center py-8">
              <i class="pi pi-inbox text-4xl text-gray-400"></i>
              <p class="text-gray-600 mt-2">No inventory records found for your branch</p>
            </div>
          </template>

          <Column field="product.sku" header="SKU">
            <template #body="{ data }">
              {{ data.product?.sku || 'N/A' }}
            </template>
          </Column>
          
          <Column field="product.product_name" header="Item Name">
            <template #body="{ data }">
              {{ data.product?.product_name || 'N/A' }}
            </template>
          </Column>
          
          <Column field="branch.name" header="Branch">
            <template #body="{ data }">
              {{ data.branch?.name || 'N/A' }}
            </template>
          </Column>
          
          <Column field="quantity_on_hand" header="On Hand" />
          <Column field="reorder_point" header="Reorder Level" />
          
          <Column header="Status">
            <template #body="{ data }">
              <Tag :value="getStockLabel(data)" :severity="getStockSeverity(data)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import inventoryService, { type BranchInventoryItem } from '../../../../services/inventory.service'

// ==================== STATE ====================
const loading = ref(false)
const items = ref<BranchInventoryItem[]>([])
const currentBranchName = ref('')
const totalRecords = ref(0)
const toast = useToast()

// ==================== FILTERS ====================
const filters = reactive({
  search: '',
  stock_status: null as string | null,
  page: 1,
  per_page: 15
})

// ==================== STOCK STATUS OPTIONS ====================
const stockStatuses = [
  { label: 'In Stock', value: 'in_stock' },
  { label: 'Low Stock', value: 'low_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' }
]

// ==================== FETCH CURRENT USER BRANCH ====================
const fetchCurrentUserBranch = async () => {
  try {
    // Get current user info including branch
    const response = await inventoryService.getCurrentUser()
    
    // Extract branch name from user data
    if (response.data?.branch?.name) {
      currentBranchName.value = response.data.branch.name
    } else if (response.data?.branch_name) {
      currentBranchName.value = response.data.branch_name
    }
    
    console.log('Current user branch:', currentBranchName.value)
  } catch (error) {
    console.error('Failed to fetch user branch:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load branch information',
      life: 3000
    })
  }
}

// ==================== LOAD INVENTORY ITEMS ====================
const loadItems = async () => {
  loading.value = true
  try {
    // Prepare query params
    const params: any = {
      page: filters.page,
      per_page: filters.per_page
    }
    
    if (filters.search) params.search = filters.search
    if (filters.stock_status) params.stock_status = filters.stock_status
    
    console.log('Fetching inventory with params:', params)
    
    // Call API - branch_id is automatically taken from authenticated user on backend
    const response = await inventoryService.getInventory(params)
    
    // Handle response based on your API structure
    if (response.success && response.data) {
      items.value = response.data.data || []
      totalRecords.value = response.data.total || 0
    } else if (response.data && Array.isArray(response.data)) {
      items.value = response.data
      totalRecords.value = response.data.length
    } else {
      items.value = []
      totalRecords.value = 0
    }
    
    console.log('Loaded items:', items.value)
  } catch (error: any) {
    console.error('Failed to load inventory', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to load inventory',
      life: 3000
    })
    items.value = []
    totalRecords.value = 0
  } finally {
    loading.value = false
  }
}

// ==================== EVENT HANDLERS ====================
const onPage = (event: any) => {
  filters.page = event.page + 1
  filters.per_page = event.rows
  loadItems()
}

const onFilterChange = () => {
  filters.page = 1
  loadItems()
}

const resetFilters = () => {
  filters.search = ''
  filters.stock_status = null
  filters.page = 1
  filters.per_page = 15
  loadItems()
}

// ==================== STOCK STATUS HELPERS ====================
const getStockLabel = (row: BranchInventoryItem) => {
  if (row.quantity_on_hand <= 0) return 'Out of Stock'
  if (row.reorder_point && row.quantity_on_hand <= row.reorder_point) return 'Low Stock'
  return 'In Stock'
}

const getStockSeverity = (row: BranchInventoryItem) => {
  if (row.quantity_on_hand <= 0) return 'danger'
  if (row.reorder_point && row.quantity_on_hand <= row.reorder_point) return 'warning'
  return 'success'
}

// ==================== WATCHERS ====================
// Debounced search
let debounceTimer: ReturnType<typeof setTimeout>
watch(
  () => filters.search,
  () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      filters.page = 1
      loadItems()
    }, 500)
  }
)

// Watch status changes
watch(
  () => filters.stock_status,
  () => {
    filters.page = 1
    loadItems()
  }
)

// ==================== LIFECYCLE ====================
onMounted(async () => {
  // First fetch current user's branch info
  await fetchCurrentUserBranch()
  
  // Then load inventory for their branch
  await loadItems()
})
</script>