<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">Stock Transfers</h1>
        <p class="text-gray-600 mt-1">Track branch-to-branch stock movements</p>
      </div>
      <Button label="Create Transfer" icon="pi pi-plus" severity="success" @click="router.push({ name: 'inventory.transfers.create' })" />
    </div>

    <Card>
      <template #content>
        <DataTable :value="transfers" :loading="loading" class="p-datatable-sm" stripedRows>
          <template #empty>
            <div class="text-center py-8">
              <i class="pi pi-inbox text-4xl text-gray-400"></i>
              <p class="text-gray-600 mt-2">No transfers found</p>
            </div>
          </template>

          <Column field="transfer_no" header="Transfer No." />
          <Column field="from_name" header="From" />
          <Column field="to_name" header="To" />
          <Column field="transfer_date" header="Date" />
          <Column field="status" header="Status">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="statusSeverity(data.status)" />
            </template>
          </Column>
          <Column header="Actions">
            <template #body="{ data }">
              <Button icon="pi pi-eye" text rounded severity="info" @click="router.push({ name: 'inventory.transfers.detail', params: { id: data.id } })" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import inventoryService from '../../../../services/inventory.service'

const router = useRouter()
const loading = ref(false)
const transfers = ref<any[]>([])

const loadTransfers = async () => {
  loading.value = true
  try {
    const response = await inventoryService.getTransfers()
    transfers.value = response.data?.data || []
  } catch (error) {
    console.error('Failed to load transfers', error)
    transfers.value = []
  } finally {
    loading.value = false
  }
}

const statusSeverity = (status: string) => {
  if (status === 'received') return 'success'
  if (status === 'shipped') return 'info'
  if (status === 'cancelled') return 'danger'
  if (status === 'approved') return 'help'
  return 'secondary'
}

onMounted(() => {
  loadTransfers()
})
</script>
