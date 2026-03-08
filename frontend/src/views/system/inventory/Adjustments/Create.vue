<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-6">
    <div class="flex items-center gap-3">
      <Button icon="pi pi-arrow-left" text rounded @click="router.push({ name: 'inventory.adjustments' })" />
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Create Stock Adjustment</h2>
        <p class="text-sm text-gray-500 mt-1">Prepare adjustment details and submit for approval</p>
      </div>
    </div>

    <Card>
      <template #content>
        <form class="space-y-6" @submit.prevent="submitAdjustment">
          <!-- Header Fields -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-gray-700">
                Adjustment Date <span class="text-red-500">*</span>
              </label>
              <DatePicker 
                v-model="form.adjustment_date" 
                dateFormat="yy-mm-dd" 
                class="w-full" 
                :class="{ 'p-invalid': errors.adjustment_date }"
              />
              <small v-if="errors.adjustment_date" class="text-red-500">{{ errors.adjustment_date }}</small>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-gray-700">
                Branch <span class="text-red-500">*</span>
              </label>
              <Select 
                v-model="form.branch_id" 
                :options="branches" 
                optionLabel="name" 
                optionValue="id" 
                placeholder="Select branch"
                :class="{ 'p-invalid': errors.branch_id }"
                :loading="loadingBranches"
                @change="onBranchChange"
              />
              <small v-if="errors.branch_id" class="text-red-500">{{ errors.branch_id }}</small>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-gray-700">
                Reason <span class="text-red-500">*</span>
              </label>
              <Select 
                v-model="form.reason" 
                :options="reasonOptions" 
                optionLabel="label" 
                optionValue="value" 
                placeholder="Select reason"
                :class="{ 'p-invalid': errors.reason }"
              />
              <small v-if="errors.reason" class="text-red-500">{{ errors.reason }}</small>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-gray-700">Reference Document</label>
              <InputText v-model="form.reference_document" placeholder="e.g., PO-2024-001, Count Sheet #123" />
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold text-gray-700">Remarks</label>
            <Textarea v-model="form.remarks" rows="2" placeholder="Optional additional notes" />
          </div>

          <!-- Items Section -->
          <Divider>
            <span class="text-sm font-semibold text-gray-600">Adjustment Items</span>
          </Divider>

          <!-- Add Item Form -->
          <div class="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 class="text-sm font-semibold text-gray-700">Add Item</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div class="flex flex-col gap-2 lg:col-span-2">
                <label class="text-sm text-gray-600">Product</label>
                <Select 
                  v-model="newItem.inventory_item_id" 
                  :options="availableProducts" 
                  optionLabel="product.product_name" 
                  optionValue="id" 
                  placeholder="Search product..."
                  :loading="loadingProducts"
                  filter
                  showClear
                >
                  <template #option="{ option }">
                    <div class="flex flex-col">
                      <span class="font-medium">{{ option.product?.product_name }}</span>
                      <span class="text-xs text-gray-500">SKU: {{ option.product?.sku }} | On Hand: {{ option.quantity_on_hand }}</span>
                    </div>
                  </template>
                </Select>
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-sm text-gray-600">Type</label>
                <Select 
                  v-model="newItem.adjustment_type" 
                  :options="adjustmentTypes" 
                  optionLabel="label" 
                  optionValue="value" 
                  placeholder="Add/Deduct"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-sm text-gray-600">Quantity</label>
                <InputNumber 
                  v-model="newItem.quantity" 
                  :min="1" 
                  showButtons
                  buttonLayout="horizontal"
                  decrementButtonClass="p-button-text"
                  incrementButtonClass="p-button-text"
                  fluid
                />
              </div>

              <div class="flex flex-col gap-2 justify-end">
                <Button 
                  icon="pi pi-plus" 
                  label="Add" 
                  @click="addItem" 
                  :disabled="!canAddItem"
                  class="mt-6"
                />
              </div>
            </div>

            <!-- Current Stock Info -->
            <div v-if="selectedProduct" class="text-sm bg-white p-2 rounded border">
              <span class="font-medium">Current Stock:</span> 
              {{ selectedProduct.quantity_on_hand }} units available
              <span v-if="selectedProduct.quantity_reserved > 0" class="text-orange-600 ml-2">
                ({{ selectedProduct.quantity_reserved }} reserved)
              </span>
            </div>
          </div>

          <!-- Items Table -->
          <DataTable 
            :value="form.items" 
            class="p-datatable-sm" 
            responsiveLayout="scroll"
            stripedRows
            showGridlines
          >
            <Column header="Product">
              <template #body="{ data }">
                <div class="flex flex-col">
                  <span class="font-medium">{{ getProductName(data.inventory_item_id) }}</span>
                  <span class="text-xs text-gray-500">SKU: {{ getProductSku(data.inventory_item_id) }}</span>
                </div>
              </template>
            </Column>
            
            <Column field="adjustment_type" header="Type">
              <template #body="{ data }">
                <Tag 
                  :severity="data.adjustment_type === 'add' ? 'success' : 'danger'"
                  :value="data.adjustment_type === 'add' ? 'ADD' : 'DEDUCT'"
                />
              </template>
            </Column>
            
            <Column field="quantity" header="Quantity" />
            
            <Column header="Current Stock">
              <template #body="{ data }">
                {{ getCurrentStock(data.inventory_item_id) }}
              </template>
            </Column>
            
            <Column header="Actions" style="width: 80px">
              <template #body="{ data, index }">
                <Button 
                  icon="pi pi-trash" 
                  text 
                  rounded 
                  severity="danger" 
                  @click="removeItem(index)"
                />
              </template>
            </Column>
            
            <template #empty>
              <div class="text-center py-4 text-gray-500">
                No items added yet. Add items using the form above.
              </div>
            </template>
          </DataTable>

          <!-- Form Actions -->
          <div class="pt-4 flex gap-2 justify-end border-t border-gray-200">
            <Button 
              label="Cancel" 
              severity="secondary" 
              outlined 
              type="button" 
              @click="cancel"
            />
            <Button 
              label="Save as Draft" 
              severity="secondary" 
              type="button" 
              :loading="savingDraft" 
              @click="saveDraft"
              :disabled="form.items.length === 0"
            />
            <Button 
              label="Submit for Approval" 
              icon="pi pi-check" 
              :loading="submitting" 
              type="submit"
              :disabled="!isFormValid"
            />
          </div>
        </form>
      </template>
    </Card>

    <!-- Confirmation Dialog for Cancel -->
    <Dialog 
      v-model:visible="showCancelDialog" 
      header="Discard Changes" 
      :modal="true" 
      class="w-full sm:w-96"
    >
      <div class="space-y-4">
        <p class="text-gray-600">Are you sure you want to cancel? Any unsaved changes will be lost.</p>
        <div class="flex justify-end gap-2">
          <Button label="No, Stay" severity="secondary" outlined @click="showCancelDialog = false" />
          <Button label="Yes, Discard" severity="danger" @click="confirmCancel" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import inventoryService from '../../../../services/inventory.service'

const router = useRouter()
const toast = useToast()

// State
const savingDraft = ref(false)
const submitting = ref(false)
const loadingBranches = ref(false)
const loadingProducts = ref(false)
const showCancelDialog = ref(false)

// Form data
const form = reactive({
  branch_id: null as number | null,
  adjustment_date: new Date(),
  reason: '',
  reference_document: '',
  remarks: '',
  items: [] as Array<{
    inventory_item_id: number
    adjustment_type: 'add' | 'deduct'
    quantity: number
    remarks?: string
  }>
})

// New item form
const newItem = reactive({
  inventory_item_id: null as number | null,
  adjustment_type: 'add' as 'add' | 'deduct',
  quantity: 1,
  remarks: ''
})

// Validation errors
const errors = ref({
  adjustment_date: '',
  branch_id: '',
  reason: ''
})

// Data from API
const branches = ref<any[]>([])
const inventoryItems = ref<any[]>([])

// Options
const reasonOptions = [
  { label: 'Physical Count Correction', value: 'physical_count' },
  { label: 'Damaged Goods', value: 'damaged' },
  { label: 'Expired Items', value: 'expired' },
  { label: 'Theft/Loss', value: 'theft' },
  { label: 'Wrong Delivery', value: 'wrong_delivery' },
  { label: 'Quality Control', value: 'quality_control' },
  { label: 'Sample/Demo Usage', value: 'sample' },
  { label: 'Other', value: 'other' }
]

const adjustmentTypes = [
  { label: 'Add Stock', value: 'add' },
  { label: 'Deduct Stock', value: 'deduct' }
]

// Computed
const availableProducts = computed(() => {
  // Filter out products already added to prevent duplicates
  const addedIds = form.items.map(item => item.inventory_item_id)
  return inventoryItems.value.filter(item => !addedIds.includes(item.id))
})

const selectedProduct = computed(() => {
  if (!newItem.inventory_item_id) return null
  return inventoryItems.value.find(item => item.id === newItem.inventory_item_id)
})

const canAddItem = computed(() => {
  return newItem.inventory_item_id && newItem.quantity > 0
})

const isFormValid = computed(() => {
  return (
    form.branch_id &&
    form.adjustment_date &&
    form.reason &&
    form.items.length > 0
  )
})

// Methods
const loadBranches = async () => {
  loadingBranches.value = true
  try {
    const response = await inventoryService.getBranches()
    // Handle API response structure
    branches.value = response.data?.data || response.data || []
  } catch (error) {
    console.error('Failed to load branches:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load branches',
      life: 3000
    })
  } finally {
    loadingBranches.value = false
  }
}

const loadInventoryItems = async () => {
  if (!form.branch_id) return
  
  loadingProducts.value = true
  try {
    const response = await inventoryService.getBranchInventory(form.branch_id, { per_page: 100 })
    // Handle API response structure - based on your return, data is in response.data.data
    inventoryItems.value = response.data?.data || []
    
    if (inventoryItems.value.length === 0) {
      toast.add({
        severity: 'info',
        summary: 'No Items',
        detail: 'No inventory items found for this branch',
        life: 3000
      })
    }
  } catch (error) {
    console.error('Failed to load inventory items:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load products',
      life: 3000
    })
  } finally {
    loadingProducts.value = false
  }
}

const onBranchChange = () => {
  // Reset products and items when branch changes
  inventoryItems.value = []
  form.items = []
  newItem.inventory_item_id = null
  
  if (form.branch_id) {
    loadInventoryItems()
  }
}

const getProductName = (inventoryItemId: number) => {
  const item = inventoryItems.value.find(i => i.id === inventoryItemId)
  return item?.product?.product_name || `Item #${inventoryItemId}`
}

const getProductSku = (inventoryItemId: number) => {
  const item = inventoryItems.value.find(i => i.id === inventoryItemId)
  return item?.product?.sku || ''
}

const getCurrentStock = (inventoryItemId: number) => {
  const item = inventoryItems.value.find(i => i.id === inventoryItemId)
  return item?.quantity_on_hand || 0
}

const addItem = () => {
  if (!canAddItem.value) return
  
  form.items.push({
    inventory_item_id: newItem.inventory_item_id!,
    adjustment_type: newItem.adjustment_type,
    quantity: newItem.quantity,
    remarks: newItem.remarks || undefined
  })
  
  // Show success toast
  toast.add({
    severity: 'success',
    summary: 'Item Added',
    detail: `${getProductName(newItem.inventory_item_id!)} has been added to the adjustment`,
    life: 2000
  })
  
  // Reset new item form
  newItem.inventory_item_id = null
  newItem.adjustment_type = 'add'
  newItem.quantity = 1
  newItem.remarks = ''
}

const removeItem = (index: number) => {
  const removedItem = form.items[index]
  form.items.splice(index, 1)
  
  toast.add({
    severity: 'info',
    summary: 'Item Removed',
    detail: `Item has been removed from the adjustment`,
    life: 2000
  })
}

const validateForm = () => {
  let isValid = true
  errors.value = { adjustment_date: '', branch_id: '', reason: '' }
  
  if (!form.adjustment_date) {
    errors.value.adjustment_date = 'Adjustment date is required'
    isValid = false
  }
  
  if (!form.branch_id) {
    errors.value.branch_id = 'Branch is required'
    isValid = false
  }
  
  if (!form.reason) {
    errors.value.reason = 'Reason is required'
    isValid = false
  }
  
  if (form.items.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'No Items',
      detail: 'Please add at least one item to adjust',
      life: 3000
    })
    isValid = false
  }
  
  return isValid
}

const toDateString = (value: Date | null) => {
  if (!value) return ''
  return value.toISOString().slice(0, 10)
}

const saveAdjustment = async (submit: boolean) => {
  if (!validateForm()) return
  
  if (submit) {
    submitting.value = true
  } else {
    savingDraft.value = true
  }
  
  try {
    // Prepare data
    const adjustmentData = {
      branch_id: form.branch_id,
      adjustment_date: toDateString(form.adjustment_date),
      reason: form.reason,
      reference_document: form.reference_document || undefined,
      remarks: form.remarks || undefined,
      items: form.items.map(item => ({
        inventory_item_id: item.inventory_item_id,
        adjustment_type: item.adjustment_type,
        quantity: item.quantity,
        remarks: item.remarks || undefined
      }))
    }
    
    // Create adjustment
    const response = await inventoryService.createAdjustment(adjustmentData)
    const adjustmentId = response.data?.id
    
    if (!adjustmentId) {
      throw new Error('No adjustment ID returned')
    }
    
    // Show success toast for creation
    toast.add({
      severity: 'success',
      summary: !submit ? 'Draft Saved' : 'Adjustment Created',
      detail: `Adjustment #${adjustmentId} has been created successfully`,
      life: 3000
    })
    
    // Submit if requested
    if (submit) {
      await inventoryService.submitAdjustment(adjustmentId)
      toast.add({
        severity: 'success',
        summary: 'Submitted',
        detail: 'Adjustment has been submitted for approval',
        life: 3000
      })
    }
    
    // Navigate back
    router.push({ name: 'inventory.adjustments' })
    
  } catch (error: any) {
    console.error('Failed to save adjustment:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to save adjustment',
      life: 5000
    })
  } finally {
    savingDraft.value = false
    submitting.value = false
  }
}

const saveDraft = async () => {
  await saveAdjustment(false)
}

const submitAdjustment = async () => {
  await saveAdjustment(true)
}

const cancel = () => {
  if (form.items.length > 0 || form.reason || form.remarks) {
    showCancelDialog.value = true
  } else {
    router.push({ name: 'inventory.adjustments' })
  }
}

const confirmCancel = () => {
  showCancelDialog.value = false
  router.push({ name: 'inventory.adjustments' })
}

// Watch for changes to show helpful messages
watch(() => newItem.inventory_item_id, (newVal) => {
  if (newVal && selectedProduct.value) {
    const product = selectedProduct.value
    if (product.quantity_on_hand === 0 && newItem.adjustment_type === 'deduct') {
      toast.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'This item is currently out of stock. Deducting may result in negative inventory.',
        life: 4000
      })
    }
  }
})

// Lifecycle
onMounted(() => {
  loadBranches()
})
</script>