<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">Stock Adjustments</h1>
        <p class="text-gray-600 mt-1">Review and track stock adjustment requests</p>
      </div>
      <Button label="Create Adjustment" icon="pi pi-plus" severity="success" @click="router.push({ name: 'inventory.adjustments.create' })" />
    </div>

    <Card class="mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText v-model="filters.search" placeholder="Search reference" class="w-full" @input="onFilterChange" />
          </IconField>

          <Select
            v-model="filters.status"
            :options="statuses"
            optionLabel="label"
            optionValue="value"
            placeholder="All Statuses"
            class="w-full"
            showClear
            @change="onFilterChange"
          />

          <Button icon="pi pi-filter-slash" label="Reset" severity="secondary" outlined @click="resetFilters" />
        </div>
      </template>
    </Card>

    <Card>
      <template #content>
        <DataTable :value="adjustments" :loading="loading" class="p-datatable-sm" stripedRows>
          <template #empty>
            <div class="text-center py-8">
              <i class="pi pi-inbox text-4xl text-gray-400"></i>
              <p class="text-gray-600 mt-2">No adjustments found</p>
            </div>
          </template>

          <Column field="reference_no" header="Reference" />
          <Column field="adjustment_date" header="Date" />
          <Column field="reason" header="Reason" />
          <Column field="status" header="Status">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="statusSeverity(data.status)" />
            </template>
          </Column>
          <Column header="Actions">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Button icon="pi pi-eye" text rounded severity="info" @click="router.push({ name: 'inventory.adjustments.detail', params: { id: data.id } })" />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import inventoryService from '../../../../services/inventory.service'

const router = useRouter()
const loading = ref(false)
const adjustments = ref<any[]>([])

const statuses = [
  { label: 'Draft', value: 'draft' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
]

const filters = reactive({
  search: '',
  status: null as string | null
})

const loadAdjustments = async () => {
  loading.value = true
  try {
    const response = await inventoryService.getAdjustments(filters)
    adjustments.value = response.data?.data || []
  } catch (error) {
    console.error('Failed to load adjustments', error)
    adjustments.value = []
  } finally {
    loading.value = false
  }
}

const onFilterChange = () => {
  loadAdjustments()
}

const resetFilters = () => {
  filters.search = ''
  filters.status = null
  loadAdjustments()
}

const statusSeverity = (status: string) => {
  if (status === 'approved') return 'success'
  if (status === 'submitted') return 'info'
  if (status === 'rejected') return 'danger'
  return 'secondary'
}

onMounted(() => {
  loadAdjustments()
})
</script>
