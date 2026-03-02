<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Tags & Collections</h2>
        <p class="text-sm text-gray-500 mt-1">Manage product tags for filtering and organization</p>
      </div>
      <Button 
        v-if="authStore.hasPermission('merchandising.tags.create')"
        label="Add Tag" 
        icon="pi pi-plus" 
        @click="openCreateDialog"
      />
    </div>

    <!-- Search & Filters -->
    <Card>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="Search tags..." class="w-full" @input="onSearch" />
          </IconField>

          <Select 
            v-model="filters.tag_type" 
            :options="tagTypes" 
            placeholder="All Types" 
            showClear 
            @change="loadTags"
          />

          <Select 
            v-model="filters.is_active" 
            :options="statusOptions" 
            optionLabel="label" 
            optionValue="value"
            placeholder="All Status" 
            showClear 
            @change="loadTags"
          />
        </div>
      </template>
    </Card>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-3">
      <Skeleton v-for="i in 5" :key="i" height="80px" class="rounded-lg" />
    </div>

    <!-- Tags Grid View -->
    <div v-else-if="tags.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <Card 
        v-for="tag in tags" 
        :key="tag.id"
        class="hover:shadow-lg transition-shadow"
      >
        <template #content>
          <div class="space-y-3">
            <!-- Tag Header -->
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900">{{ tag.tag_name }}</h3>
                <Tag :value="tag.tag_type" :severity="getTagTypeSeverity(tag.tag_type)" size="small" class="mt-2" />
              </div>
              <div class="flex gap-1">
                <Button 
                  icon="pi pi-pencil" 
                  severity="warning"
                  text 
                  rounded 
                  size="small"
                  v-tooltip.top="'Edit'"
                  @click="editTag(tag)"
                />
                <Button 
                  icon="pi pi-trash" 
                  severity="danger"
                  text 
                  rounded 
                  size="small"
                  v-tooltip.top="'Delete'"
                  @click="confirmDelete(tag)"
                />
              </div>
            </div>

            <!-- Tag Stats -->
            <div class="flex items-center justify-between pt-3 border-t border-gray-200">
              <div class="flex items-center gap-2">
                <i class="pi pi-box text-gray-500"></i>
                <span class="text-sm text-gray-600">{{ tag.products_count || 0 }} products</span>
              </div>
              <Tag 
                :value="tag.is_active ? 'Active' : 'Inactive'" 
                :severity="tag.is_active ? 'success' : 'secondary'"
                size="small"
              />
            </div>

            <!-- Color Preview (if applicable) -->
            <div v-if="tag.color_hex" class="flex items-center gap-2">
              <span class="text-xs text-gray-600">Color:</span>
              <div 
                :style="{ backgroundColor: tag.color_hex }"
                class="w-8 h-8 rounded border-2 border-gray-300"
              ></div>
              <span class="text-xs font-mono text-gray-600">{{ tag.color_hex }}</span>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Empty State -->
    <Card v-else>
      <template #content>
        <div class="text-center py-12">
          <i class="pi pi-tags text-6xl text-gray-300"></i>
          <p class="text-gray-600 mt-4 text-lg">No tags found</p>
          <p class="text-gray-500 text-sm mt-2">Create tags to organize and filter your products</p>
          <Button 
            label="Create Your First Tag" 
            icon="pi pi-plus" 
            class="mt-4" 
            @click="openCreateDialog"
          />
        </div>
      </template>
    </Card>

    <!-- Pagination -->
    <div v-if="totalRecords > 15" class="flex justify-center">
      <Paginator 
        :rows="15" 
        :totalRecords="totalRecords"
        @page="onPage"
      />
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog 
      v-model:visible="dialogVisible" 
      :header="editMode ? 'Edit Tag' : 'Create Tag'" 
      :modal="true" 
      class="w-full max-w-lg"
    >
      <div class="space-y-4 mt-4">
        <!-- Tag Name -->
        <div class="flex flex-col gap-2">
          <label for="tag_name" class="text-sm font-semibold text-gray-700">
            Tag Name <span class="text-red-500">*</span>
          </label>
          <InputText 
            id="tag_name"
            v-model="formData.tag_name" 
            placeholder="e.g., Modern, Vintage, Sale" 
            :class="{ 'p-invalid': errors.tag_name }"
          />
          <small v-if="errors.tag_name" class="text-red-500">{{ errors.tag_name }}</small>
        </div>

        <!-- Tag Type -->
        <div class="flex flex-col gap-2">
          <label for="tag_type" class="text-sm font-semibold text-gray-700">
            Tag Type <span class="text-red-500">*</span>
          </label>
          <Select 
            id="tag_type"
            v-model="formData.tag_type" 
            :options="tagTypes" 
            placeholder="Select tag type" 
            :class="{ 'p-invalid': errors.tag_type }"
          />
          <small v-if="errors.tag_type" class="text-red-500">{{ errors.tag_type }}</small>
          <small class="text-gray-500">
            • Style: Design aesthetics (Modern, Vintage, etc.)<br>
            • Room: Room categories (Living Room, Bedroom, etc.)<br>
            • Promotion: Sales and offers (Sale, New, Limited, etc.)<br>
            • Feature: Product features (Eco-friendly, Handmade, etc.)
          </small>
        </div>

        <!-- Slug (Auto-generated) -->
        <div class="flex flex-col gap-2">
          <label for="slug" class="text-sm font-semibold text-gray-700">
            Slug (URL-friendly)
          </label>
          <InputText 
            id="slug"
            v-model="formData.slug" 
            placeholder="auto-generated-from-name" 
            disabled
            class="bg-gray-100"
          />
          <small class="text-gray-500">Auto-generated from tag name</small>
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-2">
          <label for="description" class="text-sm font-semibold text-gray-700">
            Description
          </label>
          <Textarea 
            id="description"
            v-model="formData.description" 
            rows="3" 
            placeholder="Optional tag description..."
          />
        </div>

        <!-- Color (Optional) -->
        <div class="flex flex-col gap-2">
          <label for="color_hex" class="text-sm font-semibold text-gray-700">
            Color (Optional)
          </label>
          <div class="flex gap-2 items-center">
            <input 
              type="color"
              v-model="formData.color_hex"
              class="h-10 w-20 rounded border border-gray-300 cursor-pointer"
            />
            <InputText 
              id="color_hex"
              v-model="formData.color_hex" 
              placeholder="#000000" 
              class="flex-1"
              maxlength="7"
            />
          </div>
          <small class="text-gray-500">Choose a color for visual representation</small>
        </div>

        <!-- Display Order -->
        <div class="flex flex-col gap-2">
          <label for="display_order" class="text-sm font-semibold text-gray-700">
            Display Order
          </label>
          <InputNumber 
            id="display_order"
            v-model="formData.display_order" 
            :min="0"
            showButtons
          />
          <small class="text-gray-500">Lower numbers appear first</small>
        </div>

        <!-- Active Status -->
        <div class="flex items-center gap-2">
          <Checkbox v-model="formData.is_active" inputId="is_active" :binary="true" />
          <label for="is_active" class="text-sm font-semibold text-gray-700 cursor-pointer">Active</label>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" severity="secondary" outlined @click="dialogVisible = false" />
        <Button :label="editMode ? 'Update' : 'Create'" icon="pi pi-check" @click="saveTag" :loading="saving" />
      </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="deleteDialogVisible" header="Confirm Delete" :modal="true" class="w-96">
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-4xl text-red-600"></i>
        <div>
          <p class="font-semibold">Are you sure you want to delete this tag?</p>
          <p v-if="currentTag?.products_count > 0" class="text-sm text-orange-600 mt-1">
            ⚠️ This tag is used by {{ currentTag.products_count }} products. They will be untagged.
          </p>
          <p class="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" text @click="deleteDialogVisible = false" />
        <Button label="Delete" severity="danger" @click="deleteTag" :loading="deleting" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'

import { useAuthStore } from '../../../../stores/auth'
import merchandisingService from '../../../../services/merchandising.service'

const toast = useToast()
const authStore = useAuthStore()

interface Tag {
  id: number
  tag_name: string
  tag_type: string
  slug: string
  description?: string
  color_hex?: string
  display_order: number
  is_active: boolean
  products_count?: number
}



// State
const tags = ref<Tag[]>([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const editMode = ref(false)
const currentTag = ref<Tag []| null>(null)
const searchQuery = ref('')
const totalRecords = ref(0)

const filters = reactive({
  tag_type: null,
  is_active: null,
  page: 1,
  per_page: 15
})

const formData = reactive({
  tag_name: '',
  tag_type: 'Style',
  slug: '',
  description: '',
  color_hex: '#3B82F6',
  display_order: 0,
  is_active: true
})

const errors = ref<Record<string, string>>({})

const tagTypes = ['Style', 'Room', 'Promotion', 'Feature']

const statusOptions = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false }
]

// Watch tag name to auto-generate slug
watch(() => formData.tag_name, (newVal) => {
  if (!editMode.value) {
    formData.slug = newVal
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
})

// Methods
const loadTags = async () => {
  loading.value = true
  try {
    const params: any = { ...filters }
    if (searchQuery.value) params.search = searchQuery.value

    const response = await merchandisingService.getTags(params)
    tags.value = response.data.data
    totalRecords.value = response.data.total || tags.value.length
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load tags',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  filters.page = 1
  loadTags()
}

const onPage = (event: any) => {
  filters.page = event.page + 1
  loadTags()
}

const openCreateDialog = () => {
  resetForm()
  editMode.value = false
  dialogVisible.value = true
}

const editTag = (tag: any) => {
  currentTag.value = tag
  Object.assign(formData, {
    tag_name: tag.tag_name,
    tag_type: tag.tag_type,
    slug: tag.slug || '',
    description: tag.description || '',
    color_hex: tag.color_hex || '#3B82F6',
    display_order: tag.display_order || 0,
    is_active: tag.is_active
  })
  editMode.value = true
  dialogVisible.value = true
}

const saveTag = async () => {
  if (!validate()) return

  saving.value = true
  try {
    if (editMode.value) {
      await merchandisingService.updateTag(currentTag.value.id, formData)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Tag updated successfully',
        life: 3000
      })
    } else {
      await merchandisingService.createTag(formData)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Tag created successfully',
        life: 3000
      })
    }
    dialogVisible.value = false
    loadTags()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to save tag',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (tag: any) => {
  currentTag.value = tag
  deleteDialogVisible.value = true
}

const deleteTag = async () => {
  deleting.value = true
  try {
    await merchandisingService.deleteTag(currentTag.value.id)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Tag deleted successfully',
      life: 3000
    })
    deleteDialogVisible.value = false
    loadTags()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to delete tag',
      life: 3000
    })
  } finally {
    deleting.value = false
  }
}

const validate = () => {
  errors.value = {}
  
  if (!formData.tag_name) {
    errors.value.tag_name = 'Tag name is required'
  }
  
  if (!formData.tag_type) {
    errors.value.tag_type = 'Tag type is required'
  }
  
  return Object.keys(errors.value).length === 0
}

const resetForm = () => {
  formData.tag_name = ''
  formData.tag_type = 'Style'
  formData.slug = ''
  formData.description = ''
  formData.color_hex = '#3B82F6'
  formData.display_order = 0
  formData.is_active = true
  errors.value = {}
}

const getTagTypeSeverity = (type: string) => {
  const severities: Record<string, string> = {
    'Style': 'info',
    'Room': 'success',
    'Promotion': 'danger',
    'Feature': 'warning'
  }
  return severities[type] || 'secondary'
}

onMounted(() => {
  loadTags()
})
</script>

<style scoped>
:deep(.p-card-body) {
  padding: 1rem;
}
</style>