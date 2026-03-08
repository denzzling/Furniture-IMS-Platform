<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">Stock Alerts</h1>
        <p class="text-gray-600 mt-1">Track low and critical stock alerts</p>
      </div>
    </div>

    <Card>
      <template #content>
        <DataTable :value="alerts" :loading="loading" class="p-datatable-sm" stripedRows>
          <template #empty>
            <div class="text-center py-8">
              <i class="pi pi-inbox text-4xl text-gray-400"></i>
              <p class="text-gray-600 mt-2">No alerts found</p>
            </div>
          </template>

          <Column field="name" header="Branch" />
          <Column field="item_name" header="Item" />
          <Column field="sku" header="SKU" />
          <Column field="current_stock" header="Current" />
          <Column field="reorder_level" header="Reorder" />
          <Column field="severity" header="Severity">
            <template #body="{ data }">
              <Tag :value="data.severity" :severity="data.severity === 'critical' ? 'danger' : 'warning'" />
            </template>
          </Column>
          <Column header="Actions">
            <template #body="{ data }">
              <Button
                icon="pi pi-check"
                label="Acknowledge"
                size="small"
                text
                :disabled="Boolean(data.acknowledged_at)"
                @click="acknowledge(data.id)"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import inventoryService, { type StockAlert } from '../../../../services/inventory.service'

const loading = ref(false)
const alerts = ref<StockAlert[]>([])

const loadAlerts = async () => {
  loading.value = true
  try {
    const response = await inventoryService.getAlerts()
    alerts.value = response.data?.data || []
  } catch (error) {
    console.error('Failed to load alerts', error)
    alerts.value = []
  } finally {
    loading.value = false
  }
}

const acknowledge = async (id?: number) => {
  if (!id) return
  try {
    await inventoryService.acknowledgeAlert(id)
    await loadAlerts()
  } catch (error) {
    console.error('Failed to acknowledge alert', error)
  }
}

onMounted(() => {
  loadAlerts()
})
</script>
