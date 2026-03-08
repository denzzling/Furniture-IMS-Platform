<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-6">
    <div class="flex items-center gap-3">
      <Button icon="pi pi-arrow-left" text rounded @click="router.push({ name: 'inventory.transfers' })" />
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Create Stock Transfer</h2>
        <p class="text-sm text-gray-500 mt-1">Prepare transfer request between branches</p>
      </div>
    </div>

    <Card>
      <template #content>
        <form class="space-y-4" @submit.prevent="submitTransfer">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-gray-700">Transfer Date</label>
              <DatePicker v-model="form.transfer_date" dateFormat="yy-mm-dd" class="w-full" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-gray-700">From Branch</label>
              <Select v-model="form.from_branch_id" :options="branches" optionLabel="label" optionValue="value" placeholder="Select branch" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-gray-700">To Branch</label>
              <Select v-model="form.to_branch_id" :options="branches" optionLabel="label" optionValue="value" placeholder="Select branch" />
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold text-gray-700">Remarks</label>
            <Textarea v-model="form.remarks" rows="3" placeholder="Optional remarks" />
          </div>

          <div class="pt-2 flex gap-2 justify-end">
            <Button label="Save Draft" severity="secondary" outlined type="button" :loading="saving" @click="saveDraft" />
            <Button label="Save & Submit" icon="pi pi-check" :loading="saving" type="submit" />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import inventoryService from '../../../../services/inventory.service'

const router = useRouter()
const saving = ref(false)

const branches = [
  { label: 'Main Branch', value: 1 },
  { label: 'Warehouse A', value: 2 },
  { label: 'Showroom 1', value: 3 }
]

const form = reactive({
  from_branch_id: 1,
  to_branch_id: 2,
  transfer_date: new Date(),
  remarks: '',
  items: [] as Array<{ inventory_item_id: number; quantity: number; remarks?: string }>
})

const toDateString = (value: Date | null) => {
  if (!value) return ''
  return value.toISOString().slice(0, 10)
}

const saveTransfer = async (submit = true) => {
  saving.value = true
  try {
    const response = await inventoryService.createTransfer({ ...form, transfer_date: toDateString(form.transfer_date) })
    const transferId = response.data?.id

    if (submit && transferId) {
      await inventoryService.approveTransfer(transferId)
    }

    router.push({ name: 'inventory.transfers' })
  } catch (error) {
    console.error('Failed to save transfer', error)
  } finally {
    saving.value = false
  }
}

const saveDraft = async () => {
  await saveTransfer(false)
}

const submitTransfer = async () => {
  await saveTransfer(true)
}
</script>
