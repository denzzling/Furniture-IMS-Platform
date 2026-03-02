<template>
  <div class="max-w-5xl mx-auto space-y-4 md:space-y-6 pb-20 md:pb-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-gray-800">
          {{ isEditMode ? 'Edit Product' : 'Add New Product' }}
        </h2>
        <p class="text-xs md:text-sm text-gray-500 mt-1">
          {{ isEditMode ? 'Update product information' : 'Create a new furniture product' }}
        </p>
      </div>
      <Button 
        label="Back" 
        icon="pi pi-arrow-left" 
        text 
        size="small"
        @click="$router.push({ name: 'merchandising.products' })" 
        class="self-start sm:self-auto"
      />
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loadingData" class="space-y-4">
      <Skeleton height="200px" class="rounded-lg" />
      <Skeleton height="300px" class="rounded-lg" />
      <Skeleton height="200px" class="rounded-lg" />
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-4 md:space-y-6">
      <!-- Basic Information -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2 text-base md:text-lg">
            <i class="pi pi-info-circle text-blue-600"></i>
            Basic Information
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div class="flex flex-col gap-2">
              <label for="product_name" class="text-xs md:text-sm font-semibold text-gray-700">
                Product Name <span class="text-red-500">*</span>
              </label>
              <InputText 
                id="product_name"
                v-model="form.name" 
                placeholder="e.g., Modern L-Shaped Sectional" 
                :class="{ 'p-invalid': errors.name }"
                class="text-sm"
              />
              <small v-if="errors.name" class="text-red-500 text-xs">{{ errors.name }}</small>
            </div>

            <div class="flex flex-col gap-2">
              <label for="sku" class="text-xs md:text-sm font-semibold text-gray-700">
                SKU <span class="text-red-500">*</span>
              </label>
              <InputText 
                id="sku"
                v-model="form.sku" 
                placeholder="e.g., CAPS-SOFA-MOD-001" 
                :class="{ 'p-invalid': errors.sku }"
                class="text-sm"
              />
              <small v-if="errors.sku" class="text-red-500 text-xs">{{ errors.sku }}</small>
            </div>

            <div class="flex flex-col gap-2">
              <label for="category" class="text-xs md:text-sm font-semibold text-gray-700">
                Category <span class="text-red-500">*</span>
              </label>
              <Select 
                id="category"
                v-model="form.category_id" 
                :options="categories" 
                optionLabel="category_name" 
                optionValue="id"
                placeholder="Select a category" 
                :class="{ 'p-invalid': errors.category_id }"
                class="text-sm"
                :loading="loadingCategories"
              />
              <small v-if="errors.category_id" class="text-red-500 text-xs">{{ errors.category_id }}</small>
            </div>

            <div class="flex flex-col gap-2">
              <label for="status" class="text-xs md:text-sm font-semibold text-gray-700">
                Status <span class="text-red-500">*</span>
              </label>
              <Select 
                id="status"
                v-model="form.status" 
                :options="statusOptions" 
                optionLabel="label" 
                optionValue="value"
                placeholder="Select status" 
                class="text-sm"
              />
            </div>

            <div class="md:col-span-2 flex flex-col gap-2">
              <label for="description" class="text-xs md:text-sm font-semibold text-gray-700">
                Description
              </label>
              <Textarea 
                id="description"
                v-model="form.description" 
                rows="4" 
                placeholder="Enter product description..."
                class="text-sm"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Pricing & Inventory -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2 text-base md:text-lg">
            <i class="pi pi-dollar text-green-600"></i>
            Pricing & Inventory
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div class="flex flex-col gap-2">
              <label for="price" class="text-xs md:text-sm font-semibold text-gray-700">
                Selling Price ($) <span class="text-red-500">*</span>
              </label>
              <InputNumber 
                id="price"
                v-model="form.price" 
                mode="currency" 
                currency="USD" 
                locale="en-US"
                :class="{ 'p-invalid': errors.price }"
                inputClass="text-sm"
              />
              <small v-if="errors.price" class="text-red-500 text-xs">{{ errors.price }}</small>
            </div>

            <div class="flex flex-col gap-2">
              <label for="cost_price" class="text-xs md:text-sm font-semibold text-gray-700">
                Cost Price ($)
              </label>
              <InputNumber 
                id="cost_price"
                v-model="form.cost_price" 
                mode="currency" 
                currency="USD" 
                locale="en-US"
                inputClass="text-sm"
              />
              <small class="text-gray-500 text-xs">For profit calculation</small>
            </div>

            <div class="flex flex-col gap-2">
              <label for="stock_quantity" class="text-xs md:text-sm font-semibold text-gray-700">
                Stock Quantity <span class="text-red-500">*</span>
              </label>
              <InputNumber 
                id="stock_quantity"
                v-model="form.stock_quantity" 
                :min="0"
                :class="{ 'p-invalid': errors.stock_quantity }"
                inputClass="text-sm"
              />
              <small v-if="errors.stock_quantity" class="text-red-500 text-xs">{{ errors.stock_quantity }}</small>
            </div>

            <div class="flex flex-col gap-2">
              <label for="min_stock_level" class="text-xs md:text-sm font-semibold text-gray-700">
                Minimum Stock Level
              </label>
              <InputNumber 
                id="min_stock_level"
                v-model="form.min_stock_level" 
                :min="0"
                inputClass="text-sm"
              />
              <small class="text-gray-500 text-xs">Alert when stock falls below this level</small>
            </div>

            <div class="flex flex-col gap-2">
              <label for="weight" class="text-xs md:text-sm font-semibold text-gray-700">
                Weight (kg)
              </label>
              <InputNumber 
                id="weight"
                v-model="form.weight" 
                :minFractionDigits="2"
                :maxFractionDigits="2"
                inputClass="text-sm"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-xs md:text-sm font-semibold text-gray-700">
                Track Inventory
              </label>
              <div class="flex items-center gap-3 mt-2">
                <Checkbox v-model="form.track_inventory" inputId="track_inventory" :binary="true" />
                <label for="track_inventory" class="text-xs md:text-sm text-gray-600 cursor-pointer">
                  Enable inventory tracking
                </label>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Dimensions -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2 text-base md:text-lg">
            <i class="pi pi-box text-purple-600"></i>
            Dimensions
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div class="flex flex-col gap-2">
              <label for="length" class="text-xs md:text-sm font-semibold text-gray-700">
                Length (cm)
              </label>
              <InputNumber 
                id="length"
                v-model="form.dimensions.length" 
                :minFractionDigits="2"
                suffix=" cm"
                inputClass="text-sm"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="width" class="text-xs md:text-sm font-semibold text-gray-700">
                Width (cm)
              </label>
              <InputNumber 
                id="width"
                v-model="form.dimensions.width" 
                :minFractionDigits="2"
                suffix=" cm"
                inputClass="text-sm"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="height" class="text-xs md:text-sm font-semibold text-gray-700">
                Height (cm)
              </label>
              <InputNumber 
                id="height"
                v-model="form.dimensions.height" 
                :minFractionDigits="2"
                suffix=" cm"
                inputClass="text-sm"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Images -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2 text-base md:text-lg">
            <i class="pi pi-images text-pink-600"></i>
            Product Images
          </div>
        </template>
        <template #content>
          <FileUpload 
            mode="advanced" 
            name="images[]" 
            accept="image/*" 
            :maxFileSize="5000000"
            :multiple="true"
            :auto="false"
            :customUpload="true"
            @uploader="uploadImages"
            class="w-full"
          >
            <template #empty>
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 text-center">
                <i class="pi pi-cloud-upload text-3xl md:text-4xl text-gray-400 mb-3 md:mb-4"></i>
                <p class="text-sm md:text-base text-gray-600 mb-2">Drag and drop images here</p>
                <p class="text-xs md:text-sm text-gray-500">Supported formats: JPG, PNG, WebP (Max 5MB each)</p>
              </div>
            </template>
          </FileUpload>
          
          <!-- Uploaded Images Preview -->
          <div v-if="form.images && form.images.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 mt-4">
            <div v-for="(image, index) in form.images" :key="index" class="relative group">
              <img :src="image" :alt="`Product image ${index + 1}`" class="w-full h-32 object-cover rounded-lg border border-gray-200" />
              <Button 
                icon="pi pi-times" 
                severity="danger" 
                rounded 
                size="small"
                class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                @click="removeImage(index)"
              />
            </div>
          </div>
        </template>
      </Card>
    </form>

    <!-- Fixed Bottom Action Bar (Mobile) -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50 lg:hidden">
      <div class="flex gap-2">
        <Button 
          label="Cancel" 
          severity="secondary" 
          outlined 
          @click="$router.push({ name: 'merchandising.products' })"
          class="flex-1"
          size="small"
        />
        <Button 
          label="Save Draft" 
          severity="secondary" 
          @click="saveDraft"
          class="flex-1"
          size="small"
          :loading="submitting"
        />
        <Button 
          :label="isEditMode ? 'Update' : 'Create'" 
          icon="pi pi-check" 
          @click="handleSubmit"
          class="flex-1"
          size="small"
          :loading="submitting"
        />
      </div>
    </div>

    <!-- Desktop Action Bar -->
    <div class="hidden lg:flex justify-end gap-3 sticky bottom-0 bg-white p-4 border-t border-gray-200 shadow-lg rounded-lg">
      <Button 
        label="Cancel" 
        severity="secondary" 
        outlined 
        @click="$router.push({ name: 'merchandising.products' })" 
      />
      <Button 
        label="Save as Draft" 
        severity="secondary" 
        @click="saveDraft"
        :loading="submitting"
      />
      <Button 
        :label="isEditMode ? 'Update Product' : 'Create Product'" 
        icon="pi pi-check" 
        @click="handleSubmit"
        :loading="submitting"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'

import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import FileUpload from 'primevue/fileupload'
import Skeleton from 'primevue/skeleton'
import merchandisingService from '../../../../services/merchandising.service'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEditMode = computed(() => !!route.params.id)
const submitting = ref(false)
const loadingData = ref(false)
const loadingCategories = ref(false)

const form = ref({
  name: '',
  sku: '',
  category_id: null,
  status: 'Active',
  description: '',
  price: null,
  cost_price: null,
  stock_quantity: 0,
  min_stock_level: 5,
  weight: null,
  track_inventory: true,
  dimensions: {
    length: null,
    width: null,
    height: null
  },
  images: [] as string[]
})

const errors = ref<Record<string, string>>({})

const categories = ref([])

const statusOptions = ref([
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
  { label: 'Draft', value: 'Draft' }
])

const loadCategories = async () => {
  try {
    categories.value = await merchandisingService.getCategories({ perPage: 1000 })
    console.log('✅ Categories loaded:', categories.value.length, 'items')
  } catch (error) {
    console.error('❌ Failed to load categories:', error)
    categories.value = []
  }
}

const loadProduct = async () => {
  if (!isEditMode.value) return
  
  loadingData.value = true
  try {
    const product = await merchandisingService.getProduct(Number(route.params.id))
    
    form.value = {
      name: product.name,
      sku: product.sku,
      category_id: product.category_id,
      status: product.status,
      description: product.description || '',
      price: product.price,
      cost_price: product.cost_price || null,
      stock_quantity: product.stock_quantity,
      min_stock_level: product.min_stock_level || 5,
      weight: product.weight || null,
      track_inventory: true,
      dimensions: product.dimensions || { length: null, width: null, height: null },
      images: product.images || []
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to load product',
      life: 5000
    })
    router.push({ name: 'merchandising.products' })
  } finally {
    loadingData.value = false
  }
}

const validateForm = () => {
  errors.value = {}
  
  if (!form.value.name) errors.value.name = 'Product name is required'
  if (!form.value.sku) errors.value.sku = 'SKU is required'
  if (!form.value.category_id) errors.value.category_id = 'Category is required'
  if (!form.value.price) errors.value.price = 'Price is required'
  if (form.value.stock_quantity === null) errors.value.stock_quantity = 'Stock quantity is required'
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fill in all required fields',
      life: 3000
    })
    return
  }
  
  submitting.value = true
  
  try {
    if (isEditMode.value) {
      await merchandisingService.updateProduct(Number(route.params.id), form.value)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Product updated successfully',
        life: 3000
      })
    } else {
      await merchandisingService.createProduct(form.value)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Product created successfully',
        life: 3000
      })
    }
    
    router.push({ name: 'merchandising.products' })
  } catch (error: any) {
    console.error('Form submission error:', error)
    
    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {}
    }
    
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to save product',
      life: 5000
    })
  } finally {
    submitting.value = false
  }
}

const saveDraft = () => {
  form.value.status = 'Draft'
  handleSubmit()
}

const uploadImages = async (event: any) => {
  // Handle image upload - implement based on your backend
  const files = event.files
  // Upload logic here
  toast.add({
    severity: 'info',
    summary: 'Upload',
    detail: `${files.length} image(s) uploaded`,
    life: 3000
  })
}

const removeImage = (index: number) => {
  form.value.images.splice(index, 1)
}

onMounted(() => {
  loadCategories()
  loadProduct()
})
</script>

<style scoped>
/* Mobile-specific styles */
@media (max-width: 640px) {
  :deep(.p-inputnumber-input) {
    font-size: 0.875rem;
  }
  
  :deep(.p-dropdown) {
    font-size: 0.875rem;
  }
}
</style>