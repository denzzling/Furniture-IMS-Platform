<template>
  <div class="p-6 bg-gray-50 min-h-screen space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-800">Inventory Reports</h1>
      <p class="text-gray-600 mt-1">Generate and review stock analytics reports</p>
    </div>

    <Card>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button label="Stock Movement Report" icon="pi pi-chart-line" class="w-full" @click="loadStockMovement" />
          <Button label="Inventory Valuation" icon="pi pi-calculator" severity="secondary" class="w-full" @click="loadValuation" />
          <Button label="Aging Report" icon="pi pi-clock" severity="info" class="w-full" @click="loadAging" />
        </div>
      </template>
    </Card>

    <Card>
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-file text-blue-600"></i>
          <span>Report Preview</span>
        </div>
      </template>
      <template #content>
        <div v-if="loading" class="space-y-3">
          <Skeleton v-for="i in 4" :key="i" height="52px" class="rounded-lg" />
        </div>
        <DataTable v-else :value="rows" class="p-datatable-sm" stripedRows>
          <template #empty>
            <div class="text-center py-8">
              <i class="pi pi-file text-4xl text-gray-400"></i>
              <p class="text-gray-600 mt-2">Select a report type to preview data</p>
            </div>
          </template>
          <Column field="label" header="Metric" />
          <Column field="value" header="Value" />
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import inventoryService from '../../../../services/inventory.service'

const loading = ref(false)
const rows = ref<Array<{ label: string; value: string | number }>>([])

const normalize = (data: any) => {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    return Object.entries(data).map(([label, value]) => ({ label, value: String(value) }))
  }
  return []
}

const loadStockMovement = async () => {
  loading.value = true
  try {
    const response = await inventoryService.getStockMovementReport()
    rows.value = normalize(response.data)
  } catch (error) {
    console.error('Failed to load stock movement report', error)
    rows.value = []
  } finally {
    loading.value = false
  }
}

const loadValuation = async () => {
  loading.value = true
  try {
    const response = await inventoryService.getInventoryValuationReport()
    rows.value = normalize(response.data)
  } catch (error) {
    console.error('Failed to load valuation report', error)
    rows.value = []
  } finally {
    loading.value = false
  }
}

const loadAging = async () => {
  loading.value = true
  try {
    const response = await inventoryService.getAgingReport()
    rows.value = normalize(response.data)
  } catch (error) {
    console.error('Failed to load aging report', error)
    rows.value = []
  } finally {
    loading.value = false
  }
}
</script>
