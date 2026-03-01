<template>
  <div class="min-h-screen bg-gray-50 p-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Add New Product</h1>
        <p class="text-gray-600">Register a new furniture product</p>
      </div>

      <!-- Form Card -->
      <Card class="shadow-md">
        <template #content>
          <form @submit.prevent="submitForm" class="space-y-6">
            <!-- Section 1: Basic Info -->
            <div class="border-b pb-6">
              <h3 class="text-lg font-semibold text-gray-700 mb-4">
                <i class="pi pi-info-circle mr-2"></i>
                Basic Information
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Product Name -->
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700">
                    Product Name *
                  </label>
                  <InputText 
                    v-model="form.productName"
                    placeholder="e.g., Modern Sofa"
                    class="w-full"
                    :class="{ 'p-invalid': errors.productName }"
                  />
                  <small v-if="errors.productName" class="p-error">
                    {{ errors.productName }}
                  </small>
                </div>

                <!-- SKU -->
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700">
                    SKU Code *
                  </label>
                  <InputText 
                    v-model="form.sku"
                    placeholder="e.g., SOFA-001"
                    class="w-full"
                    :class="{ 'p-invalid': errors.sku }"
                  />
                  <small v-if="errors.sku" class="p-error">
                    {{ errors.sku }}
                  </small>
                </div>

                <!-- Category -->
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <Dropdown 
                    v-model="form.categoryId"
                    :options="categories"
                    optionLabel="category_name"
                    optionValue="category_id"
                    placeholder="Select Category"
                    class="w-full"
                    :class="{ 'p-invalid': errors.categoryId }"
                  />
                  <small v-if="errors.categoryId" class="p-error">
                    {{ errors.categoryId }}
                  </small>
                </div>

                <!-- Supplier -->
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700">
                    Supplier
                  </label>
                  <Dropdown 
                    v-model="form.supplierId"
                    :options="suppliers"
                    optionLabel="supplier_name"
                    optionValue="supplier_id"
                    placeholder="Select Supplier"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Description -->
              <div class="mt-4 space-y-1">
                <label class="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <Textarea 
                  v-model="form.description"
                  placeholder="Describe your product..."
                  rows="3"
                  class="w-full"
                  :autoResize="true"
                />
              </div>
            </div>

            <!-- Section 2: Pricing -->
            <div class="border-b pb-6">
              <h3 class="text-lg font-semibold text-gray-700 mb-4">
                <i class="pi pi-tag mr-2"></i>
                Pricing
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Cost Price -->
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700">
                    Cost Price (₱) *
                  </label>
                  <InputNumber 
                    v-model="form.costPrice"
                    mode="currency"
                    currency="PHP"
                    locale="en-PH"
                    class="w-full"
                    :class="{ 'p-invalid': errors.costPrice }"
                  />
                  <small v-if="errors.costPrice" class="p-error">
                    {{ errors.costPrice }}
                  </small>
                </div>

                <!-- Selling Price -->
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700">
                    Selling Price (₱) *
                  </label>
                  <InputNumber 
                    v-model="form.sellingPrice"
                    mode="currency"
                    currency="PHP"
                    locale="en-PH"
                    class="w-full"
                    :class="{ 'p-invalid': errors.sellingPrice }"
                  />
                  <small v-if="errors.sellingPrice" class="p-error">
                    {{ errors.sellingPrice }}
                  </small>
                </div>
              </div>

              <!-- Discount -->
              <div class="mt-4 max-w-xs">
                <label class="block text-sm font-medium text-gray-700">
                  Discount Percentage
                </label>
                <InputNumber 
                  v-model="form.discountPercentage"
                  suffix="%"
                  :min="0"
                  :max="100"
                  class="w-full"
                />
              </div>

              <!-- Price Preview -->
              <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 class="font-medium text-gray-700 mb-2">Price Summary</h4>
                <div class="space-y-1">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Cost:</span>
                    <span>₱{{ formatNumber(form.costPrice) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Selling Price:</span>
                    <span>₱{{ formatNumber(form.sellingPrice) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Discount:</span>
                    <span>{{ form.discountPercentage }}%</span>
                  </div>
                  <div class="flex justify-between font-bold border-t pt-1">
                    <span>Final Price:</span>
                    <span class="text-green-600">
                      ₱{{ formatNumber(finalPrice) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 3: Dimensions -->
            <div class="border-b pb-6">
              <h3 class="text-lg font-semibold text-gray-700 mb-4">
                <i class="pi pi-ruler mr-2"></i>
                Dimensions (in cm)
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Length -->
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700">
                    Length *
                  </label>
                  <InputNumber 
                    v-model="form.length"
                    suffix=" cm"
                    :min="1"
                    class="w-full"
                    :class="{ 'p-invalid': errors.length }"
                  />
                  <small v-if="errors.length" class="p-error">
                    {{ errors.length }}
                  </small>
                </div>

                <!-- Width -->
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700">
                    Width *
                  </label>
                  <InputNumber 
                    v-model="form.width"
                    suffix=" cm"
                    :min="1"
                    class="w-full"
                    :class="{ 'p-invalid': errors.width }"
                  />
                  <small v-if="errors.width" class="p-error">
                    {{ errors.width }}
                  </small>
                </div>

                <!-- Height -->
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700">
                    Height *
                  </label>
                  <InputNumber 
                    v-model="form.height"
                    suffix=" cm"
                    :min="1"
                    class="w-full"
                    :class="{ 'p-invalid': errors.height }"
                  />
                  <small v-if="errors.height" class="p-error">
                    {{ errors.height }}
                  </small>
                </div>
              </div>

              <!-- Weight -->
              <div class="mt-4 max-w-xs">
                <label class="block text-sm font-medium text-gray-700">
                  Weight (kg)
                </label>
                <InputNumber 
                  v-model="form.weight"
                  suffix=" kg"
                  :min="0.1"
                  class="w-full"
                />
              </div>
            </div>

            <!-- Section 4: Inventory -->
            <div class="border-b pb-6">
              <h3 class="text-lg font-semibold text-gray-700 mb-4">
                <i class="pi pi-box mr-2"></i>
                Inventory
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Initial Stock -->
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700">
                    Initial Stock *
                  </label>
                  <InputNumber 
                    v-model="form.initialStock"
                    :min="0"
                    class="w-full"
                    :class="{ 'p-invalid': errors.initialStock }"
                  />
                  <small v-if="errors.initialStock" class="p-error">
                    {{ errors.initialStock }}
                  </small>
                </div>

                <!-- Reorder Point -->
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700">
                    Reorder Point
                  </label>
                  <InputNumber 
                    v-model="form.reorderPoint"
                    :min="0"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Branch -->
              <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700">
                  Branch
                </label>
                <Dropdown 
                  v-model="form.branchId"
                  :options="branches"
                  optionLabel="branch_name"
                  optionValue="branch_id"
                  placeholder="Select Branch"
                  class="w-full max-w-md"
                />
              </div>
            </div>

            <!-- Section 5: Material & Color -->
            <div>
              <h3 class="text-lg font-semibold text-gray-700 mb-4">
                <i class="pi pi-palette mr-2"></i>
                Material & Color
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Material -->
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700">
                    Primary Material
                  </label>
                  <Dropdown 
                    v-model="form.material"
                    :options="materialOptions"
                    placeholder="Select Material"
                    class="w-full"
                  />
                </div>

                <!-- Color -->
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700">
                    Color
                  </label>
                  <div class="flex items-center gap-3">
                    <InputText 
                      v-model="form.colorName"
                      placeholder="e.g., Midnight Blue"
                      class="flex-1"
                    />
                    <input 
                      type="color" 
                      v-model="form.colorHex"
                      class="w-10 h-10 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end gap-3 pt-6">
              <Button 
                label="Cancel" 
                severity="secondary" 
                outlined
                @click="$router.back()"
                :disabled="isSubmitting"
              />
              <Button 
                label="Save as Draft" 
                severity="info" 
                outlined
                @click="saveAsDraft"
                :disabled="isSubmitting"
              />
              <Button 
                label="Add Product" 
                type="submit"
                :loading="isSubmitting"
                :disabled="!isFormValid || isSubmitting"
              />
            </div>
          </form>
        </template>
      </Card>

      <!-- Toast Container -->
      <Toast position="top-right" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
// import { productService } from './services/productService'

const router = useRouter()
const toast = useToast()

// Form Data
const form = reactive({
  productName: '',
  sku: '',
  categoryId: null,
  supplierId: null,
  description: '',
  costPrice: 0,
  sellingPrice: 0,
  discountPercentage: 0,
  length: 0,
  width: 0,
  height: 0,
  weight: 0,
  initialStock: 0,
  reorderPoint: 10,
  branchId: null,
  material: '',
  colorName: '',
  colorHex: '#000000'
})

// Error tracking
const errors = reactive({})

// UI State
const isSubmitting = ref(false)
const categories = ref([])
const suppliers = ref([])
const branches = ref([])

// Dropdown Options
const materialOptions = ref([
  'Wood', 'Metal', 'Fabric', 'Leather', 'Plastic', 'Glass', 'Rattan', 'Marble'
])

// Computed Properties
const finalPrice = computed(() => {
  const discount = (form.sellingPrice * form.discountPercentage) / 100
  return form.sellingPrice - discount
})

const isFormValid = computed(() => {
  return (
    form.productName &&
    form.sku &&
    form.categoryId &&
    form.costPrice > 0 &&
    form.sellingPrice >= form.costPrice &&
    form.length > 0 &&
    form.width > 0 &&
    form.height > 0 &&
    form.initialStock >= 0
  )
})

// Load dropdown data
onMounted(async () => {
  try {
    // Simulate API call - replace with actual API
    categories.value = [
      { category_id: 1, category_name: 'Sofa' },
      { category_id: 2, category_name: 'Chair' },
      { category_id: 3, category_name: 'Table' },
      { category_id: 4, category_name: 'Bed' },
      { category_id: 5, category_name: 'Cabinet' },
    ]
    
    suppliers.value = [
      { supplier_id: 1, supplier_name: 'ABC Furniture Supply' },
      { supplier_id: 2, supplier_name: 'XYZ Woodworks' },
    ]
    
    branches.value = [
      { branch_id: 1, branch_name: 'Main Branch - Manila' },
      { branch_id: 2, branch_name: 'Cavite Showroom' },
    ]
  } catch (error) {
    showError('Failed to load form data')
  }
})

// Validation
const validateForm = () => {
  // Clear previous errors
  Object.keys(errors).forEach(key => delete errors[key])
  
  let isValid = true

  // Required fields validation
  if (!form.productName.trim()) {
    errors.productName = 'Product name is required'
    isValid = false
  }

  if (!form.sku.trim()) {
    errors.sku = 'SKU is required'
    isValid = false
  }

  if (!form.categoryId) {
    errors.categoryId = 'Category is required'
    isValid = false
  }

  if (form.costPrice <= 0) {
    errors.costPrice = 'Cost price must be greater than 0'
    isValid = false
  }

  if (form.sellingPrice < form.costPrice) {
    errors.sellingPrice = 'Selling price must be greater than or equal to cost price'
    isValid = false
  }

  if (form.length <= 0) {
    errors.length = 'Length must be greater than 0'
    isValid = false
  }

  if (form.width <= 0) {
    errors.width = 'Width must be greater than 0'
    isValid = false
  }

  if (form.height <= 0) {
    errors.height = 'Height must be greater than 0'
    isValid = false
  }

  if (form.initialStock < 0) {
    errors.initialStock = 'Stock cannot be negative'
    isValid = false
  }

  return isValid
}

// Form Submission
const submitForm = async () => {
  if (!validateForm()) {
    showError('Please fix the errors in the form')
    return
  }

  isSubmitting.value = true
  localStorage.setItem('hasProduct', true)

  try {
    const productData = {
      product: {
        product_name: form.productName,
        sku: form.sku,
        category_id: form.categoryId,
        supplier_id: form.supplierId,
        description: form.description,
        cost_price: form.costPrice,
        selling_price: form.sellingPrice,
        discount_percentage: form.discountPercentage,
        status: 'active'
      },
      dimensions: {
        length_cm: form.length,
        width_cm: form.width,
        height_cm: form.height,
        weight_kg: form.weight
      },
      inventory: {
        branch_id: form.branchId,
        quantity: form.initialStock,
        reorder_point: form.reorderPoint
      },
      material: {
        primary_material: form.material,
        color_name: form.colorName,
        color_hex: form.colorHex
      }
    }

    // Call API
    // const response = await productService.createProduct(productData)
    
    showSuccess('Product added successfully!')
    
    // Redirect after 2 seconds
    setTimeout(() => {
      router.push('/products')
    }, 2000)

  } catch (error) {
    showError(error.message || 'Failed to add product')
  } finally {
    isSubmitting.value = false
  }
}

// Save as Draft
const saveAsDraft = async () => {
  if (!form.productName || !form.sku) {
    showError('Product name and SKU are required to save as draft')
    return
  }

  isSubmitting.value = true
    localStorage.setItem('hasProduct', true)

  try {
    const draftData = {
      ...form,
      status: 'draft'
    }
    
    // await productService.saveAsDraft(draftData)
    showSuccess('Draft saved successfully!')
    
  } catch (error) {
    showError('Failed to save draft')
  } finally {
    isSubmitting.value = false
  }
}

// Helper Functions
const formatNumber = (num) => {
  return Number(num || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const showSuccess = (message) => {
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: message,
    life: 3000
  })
}

const showError = (message) => {
  toast.add({
    severity: 'error',
    summary: 'Error',
    detail: message,
    life: 4000
  })
}
</script>

<style scoped>
/* Custom styles */
:deep(.p-card) {
  border-radius: 8px;
}

:deep(.p-card-content) {
  padding: 1.5rem;
}

:deep(.p-button) {
  min-width: 100px;
}

:deep(.p-dropdown),
:deep(.p-inputtext),
:deep(.p-inputnumber) {
  width: 100%;
}
</style>