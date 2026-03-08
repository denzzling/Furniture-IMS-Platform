<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-6">
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <Button icon="pi pi-arrow-left" text rounded @click="router.push({ name: 'inventory.adjustments' })" />
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Adjustment Details</h2>
          <p class="text-sm text-gray-500 mt-1">Review and process stock adjustment</p>
        </div>
      </div>
      <Tag :value="detail?.status || 'draft'" :severity="statusSeverity(detail?.status || 'draft')" />
    </div>

    <div v-if="loading" class="space-y-4">
      <Skeleton height="180px" class="rounded-lg" />
      <Skeleton height="250px" class="rounded-lg" />
    </div>

    <div v-else class="space-y-6">
      <Card>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p class="text-xs text-gray-600">Reference</p>
              <p class="font-semibold text-gray-900">{{ detail?.reference_no || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-600">Date</p>
              <p class="font-semibold text-gray-900">{{ detail?.adjustment_date || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-600">Reason</p>
              <p class="font-semibold text-gray-900">{{ detail?.reason || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-600">Branch</p>
              <p class="font-semibold text-gray-900">{{ detail?.name || '-' }}</p>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-list text-emerald-600"></i>
            <span>Adjustment Items</span>
          </div>
        </template>
        <template #content>
          <DataTable :value="detail?.items || []" class="p-datatable-sm" stripedRows>
            <Column field="item_name" header="Item" />
            <Column field="adjustment_type" header="Type" />
            <Column field="quantity" header="Quantity" />
            <Column field="remarks" header="Remarks" />
          </DataTable>

          <div v-if="canAction" class="pt-4 flex gap-2 justify-end">
            <Button label="Reject" icon="pi pi-times" severity="danger" outlined :loading="processing" @click="rejectAdjustment" />
            <Button label="Approve" icon="pi pi-check" severity="success" :loading="processing" @click="approveAdjustment" />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import inventoryService from '../../../../services/inventory.service'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const processing = ref(false)
const detail = ref<any>(null)

const adjustmentId = computed(() => Number(route.params.id))
const canAction = computed(() => ['submitted'].includes(detail.value?.status))

const loadDetail = async () => {
  loading.value = true
  try {
    const response = await inventoryService.getAdjustment(adjustmentId.value)
    detail.value = response.data || null
  } catch (error) {
    console.error('Failed to load adjustment detail', error)
    detail.value = null
  } finally {
    loading.value = false
  }
}

const approveAdjustment = async () => {
  processing.value = true
  try {
    await inventoryService.approveAdjustment(adjustmentId.value)
    await loadDetail()
  } catch (error) {
    console.error('Failed to approve adjustment', error)
  } finally {
    processing.value = false
  }
}

const rejectAdjustment = async () => {
  processing.value = true
  try {
    await inventoryService.rejectAdjustment(adjustmentId.value)
    await loadDetail()
  } catch (error) {
    console.error('Failed to reject adjustment', error)
  } finally {
    processing.value = false
  }
}

const statusSeverity = (status: string) => {
  if (status === 'approved') return 'success'
  if (status === 'submitted') return 'info'
  if (status === 'rejected') return 'danger'
  return 'secondary'
}

onMounted(() => {
  loadDetail()
})
</script>
