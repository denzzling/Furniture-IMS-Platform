<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">3D Models & Assets</h2>
        <p class="text-sm text-gray-500 mt-1">Upload and manage 3D models, images, videos, and documents</p>
      </div>
      <Button 
        v-if="authStore.hasPermission('merchandising.assets.upload')"
        label="Upload Assets" 
        icon="pi pi-cloud-upload" 
        @click="$router.push({ name: 'merchandising.assets.upload' })"
      />
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card v-for="stat in assetStats" :key="stat.type" class="hover:shadow-lg transition-shadow">
        <template #content>
          <div class="text-center">
            <div :class="[stat.bgColor, 'inline-flex p-4 rounded-full mb-3']">
              <i :class="[stat.icon, stat.iconColor, 'text-2xl']"></i>
            </div>
            <p class="text-sm text-gray-600">{{ stat.label }}</p>
            <h3 class="text-2xl font-bold text-gray-900 mt-1">{{ stat.count }}</h3>
            <p class="text-xs text-gray-500 mt-1">{{ formatFileSize(stat.totalSize) }}</p>
          </div>
        </template>
      </Card>
    </div>

    <!-- Filters -->
    <Card>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="Search assets..." class="w-full" @input="onSearch" />
          </IconField>

          <Select 
            v-model="filters.asset_type" 
            :options="assetTypes" 
            optionLabel="label"
            optionValue="value"
            placeholder="All Types" 
            showClear 
            @change="loadAssets"
          />

          <Select 
            v-model="filters.product_id" 
            :options="products" 
            optionLabel="product_name" 
            optionValue="id"
            placeholder="All Products" 
            showClear 
            filter
            @change="loadAssets"
          />

          <div class="flex gap-2">
            <Button 
              :label="viewMode === 'grid' ? 'Grid' : 'List'" 
              :icon="viewMode === 'grid' ? 'pi pi-th-large' : 'pi pi-list'"
              :severity="viewMode === 'grid' ? 'primary' : 'secondary'"
              outlined
              @click="toggleViewMode"
              class="flex-1"
            />
            <Button 
              label="Bulk Delete" 
              icon="pi pi-trash" 
              severity="danger"
              outlined
              @click="bulkDeleteAssets"
              :disabled="selectedAssets.length === 0"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <Skeleton v-for="i in 8" :key="i" height="250px" class="rounded-lg" />
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid' && assets.length > 0" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <Card 
        v-for="asset in assets" 
        :key="asset.id"
        class="hover:shadow-lg transition-shadow cursor-pointer"
        @click="viewAsset(asset)"
      >
        <template #content>
          <div class="space-y-3">
            <!-- Asset Preview -->
            <div class="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
              <!-- ✅ 3D Model Preview with Three.js -->
              <div 
                v-if="asset.asset_type === '3D_Model'" 
                :ref="el => set3DContainerRef(asset.id, el)"
                class="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100"
              >
                <!-- Loading indicator for 3D models -->
                <div v-if="!asset.model_loaded" class="w-full h-full flex items-center justify-center">
                  <div class="text-center">
                    <i class="pi pi-spin pi-spinner text-4xl text-indigo-600 mb-2"></i>
                    <p class="text-xs text-gray-600">Loading 3D model...</p>
                  </div>
                </div>
              </div>

              <!-- Image Preview -->
              <img 
                v-else-if="asset.asset_type.includes('Image')"
                :src="asset.thumbnail_url || asset.url" 
                :alt="asset.file_name"
                class="w-full h-full object-cover"
                @error="handleImageError"
              />

              <!-- Video Preview -->
              <div v-else-if="asset.asset_type === 'Video_Product'" class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
                <i class="pi pi-video text-6xl text-purple-600"></i>
              </div>

              <!-- PDF Preview -->
              <div v-else-if="asset.asset_type === 'Manual_PDF'" class="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
                <i class="pi pi-file-pdf text-6xl text-red-600"></i>
              </div>

              <!-- Hover Overlay -->
              <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div class="flex gap-2">
                  <Button 
                    icon="pi pi-eye" 
                    rounded 
                    @click.stop="viewAsset(asset)"
                  />
                  <Button 
                    icon="pi pi-download" 
                    rounded 
                    severity="secondary"
                    @click.stop="downloadAsset(asset)"
                  />
                  <Button 
                    v-if="authStore.hasPermission('merchandising.assets.delete')"
                    icon="pi pi-trash" 
                    rounded 
                    severity="danger"
                    @click.stop="confirmDelete(asset)"
                  />
                </div>
              </div>

              <!-- Primary Badge -->
              <Badge 
                v-if="asset.is_primary" 
                value="Primary" 
                severity="success" 
                class="absolute top-2 left-2"
              />

              <!-- Checkbox for selection -->
              <div class="absolute top-2 right-2" @click.stop>
                <Checkbox 
                  v-model="selectedAssets" 
                  :value="asset.id" 
                  :binary="false"
                />
              </div>
            </div>

            <!-- Asset Info -->
            <div>
              <p class="text-sm font-semibold text-gray-900 truncate">{{ asset.file_name }}</p>
              <div class="flex items-center gap-2 mt-2">
                <Tag :value="getAssetTypeLabel(asset.asset_type)" :severity="getAssetTypeSeverity(asset.asset_type)" size="small" />
                <span class="text-xs text-gray-500">{{ formatFileSize(asset.file_size_kb * 1024) }}</span>
              </div>
              <p v-if="asset.product" class="text-xs text-gray-600 mt-2 truncate">
                {{ asset.product.product_name }}
              </p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- List View (keeping existing code) -->
    <!-- ... rest of your list view code ... -->

    <!-- View Asset Dialog with 3D Viewer -->
    <Dialog 
      v-model:visible="viewDialogVisible" 
      :header="currentAsset?.file_name" 
      :modal="true" 
      class="w-full max-w-4xl"
    >
      <div v-if="currentAsset" class="space-y-4">
        <!-- Asset Preview -->
        <div class="bg-gray-100 rounded-lg p-8 flex items-center justify-center" style="min-height: 500px;">
          <!-- ✅ 3D Model Viewer in Dialog -->
          <div 
            v-if="currentAsset.asset_type === '3D_Model'"
            ref="dialog3DContainer"
            class="w-full h-full"
            style="min-height: 500px;"
          ></div>

          <!-- Image Preview -->
          <img 
            v-else-if="currentAsset.asset_type.includes('Image')"
            :src="currentAsset.url" 
            :alt="currentAsset.file_name"
            class="max-w-full max-h-96 object-contain"
          />

          <!-- Video Preview -->
          <video 
            v-else-if="currentAsset.asset_type === 'Video_Product'"
            :src="currentAsset.url"
            controls
            class="max-w-full max-h-96"
          ></video>

          <!-- Other file types -->
          <i v-else :class="getAssetIcon(currentAsset.asset_type)" class="text-8xl text-gray-400"></i>
        </div>

        <!-- Asset Details -->
        <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p class="text-xs text-gray-600 mb-1">Type</p>
            <Tag :value="getAssetTypeLabel(currentAsset.asset_type)" :severity="getAssetTypeSeverity(currentAsset.asset_type)" />
          </div>
          <div>
            <p class="text-xs text-gray-600 mb-1">File Size</p>
            <p class="text-sm font-semibold">{{ formatFileSize(currentAsset.file_size_kb * 1024) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-600 mb-1">Product</p>
            <p class="text-sm font-semibold">{{ currentAsset.product?.product_name || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-600 mb-1">Uploaded</p>
            <p class="text-sm font-semibold">{{ formatDate(currentAsset.created_at) }}</p>
          </div>
          <div class="col-span-2">
            <p class="text-xs text-gray-600 mb-1">URL</p>
            <p class="text-sm font-mono text-blue-600 break-all">{{ currentAsset.url }}</p>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Download" icon="pi pi-download" @click="downloadAsset(currentAsset)" />
        <Button label="Close" severity="secondary" outlined @click="closeViewDialog" />
      </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="deleteDialogVisible" header="Confirm Delete" :modal="true" class="w-96">
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-4xl text-red-600"></i>
        <div>
          <p class="font-semibold">Are you sure you want to delete this asset?</p>
          <p class="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" text @click="deleteDialogVisible = false" />
        <Button label="Delete" severity="danger" @click="deleteAsset" :loading="deleting" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../../../../stores/auth'
import merchandisingService from '../../../../services/merchandising.service'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import Badge from 'primevue/badge'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

const toast = useToast()
const authStore = useAuthStore()

// State
const assets = ref([])
const products = ref([])
const loading = ref(false)
const deleting = ref(false)
const viewDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const currentAsset = ref(null)
const selectedAssets = ref([])
const searchQuery = ref('')
const viewMode = ref('grid')
const dialog3DContainer = ref(null)

// 3D Model state
const modelContainers = ref<Map<number, HTMLElement>>(new Map())
const modelScenes = ref<Map<number, any>>(new Map())

const filters = reactive({
  asset_type: null,
  product_id: null
})

const assetTypes = [
  { label: '3D Models', value: '3D_Model' },
  { label: 'Main Images', value: 'Image_Main' },
  { label: 'Gallery Images', value: 'Image_Gallery' },
  { label: 'Videos', value: 'Video_Product' },
  { label: 'PDFs/Manuals', value: 'Manual_PDF' }
]

// Computed
const assetStats = computed(() => {
  const stats = [
    {
      type: '3D_Model',
      label: '3D Models',
      icon: 'pi pi-cube',
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      count: 0,
      totalSize: 0
    },
    {
      type: 'Image',
      label: 'Images',
      icon: 'pi pi-image',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      count: 0,
      totalSize: 0
    },
    {
      type: 'Video',
      label: 'Videos',
      icon: 'pi pi-video',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
      count: 0,
      totalSize: 0
    },
    {
      type: 'PDF',
      label: 'PDFs',
      icon: 'pi pi-file-pdf',
      iconColor: 'text-red-600',
      bgColor: 'bg-red-100',
      count: 0,
      totalSize: 0
    },
    {
      type: 'Total',
      label: 'Total Assets',
      icon: 'pi pi-folder',
      iconColor: 'text-gray-600',
      bgColor: 'bg-gray-100',
      count: assets.value.length,
      totalSize: assets.value.reduce((sum: number, asset: any) => sum + (asset.file_size_kb * 1024), 0)
    }
  ]

  assets.value.forEach((asset: any) => {
    if (asset.asset_type === '3D_Model') {
      stats[0].count++
      stats[0].totalSize += asset.file_size_kb * 1024
    } else if (asset.asset_type.includes('Image')) {
      stats[1].count++
      stats[1].totalSize += asset.file_size_kb * 1024
    } else if (asset.asset_type === 'Video_Product') {
      stats[2].count++
      stats[2].totalSize += asset.file_size_kb * 1024
    } else if (asset.asset_type === 'Manual_PDF') {
      stats[3].count++
      stats[3].totalSize += asset.file_size_kb * 1024
    }
  })

  return stats
})

// ✅ 3D Model Methods
const set3DContainerRef = (assetId: number, el: HTMLElement | null) => {
  if (el) {
    modelContainers.value.set(assetId, el)
    // Load 3D model after container is mounted
    nextTick(() => {
      const asset = assets.value.find((a: any) => a.id === assetId)
      if (asset && asset.asset_type === '3D_Model') {
        load3DModel(asset, el)
      }
    })
  }
}

const load3DModel = (asset: any, container: HTMLElement) => {
  if (!container) return

  const width = container.clientWidth
  const height = container.clientHeight

  // Create scene
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f4f8)

  // Create camera
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
  camera.position.set(2, 2, 5)

  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.shadowMap.enabled = true
  container.appendChild(renderer.domElement)

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 7.5)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  // Add orbit controls
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 1
  controls.maxDistance = 20

  // Load model
  const loader = asset.model_format === 'obj' ? new OBJLoader() : new GLTFLoader()
  
  loader.load(
    asset.url,
    (model: any) => {
      const object = asset.model_format === 'obj' ? model : model.scene
      
      // Center the model
      const box = new THREE.Box3().setFromObject(object)
      const center = box.getCenter(new THREE.Vector3())
      object.position.sub(center)

      // Scale to fit
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 2 / maxDim
      object.scale.multiplyScalar(scale)

      scene.add(object)
      asset.model_loaded = true

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
      }
      animate()
    },
    (progress: any) => {
      console.log('Loading:', (progress.loaded / progress.total * 100).toFixed(2) + '%')
    },
    (error: any) => {
      console.error('Error loading 3D model:', error)
      asset.model_loaded = false
    }
  )

  // Store scene for cleanup
  modelScenes.value.set(asset.id, { scene, renderer, controls })
}

const load3DModelInDialog = () => {
  if (!dialog3DContainer.value || !currentAsset.value) return
  
  setTimeout(() => {
    load3DModel(currentAsset.value, dialog3DContainer.value)
  }, 100)
}

// Methods
const loadAssets = async () => {
  loading.value = true
  try {
    const params: any = { ...filters }
    if (searchQuery.value) params.search = searchQuery.value

    const response = await merchandisingService.getAssets(params)
    assets.value = response.data.data.map((asset: any) => ({
      ...asset,
      model_loaded: false
    }))
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load assets',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const loadProducts = async () => {
  try {
    const response = await merchandisingService.getProducts({ per_page: 1000 })
    products.value = response.data.data
  } catch (error) {
    console.error('Failed to load products:', error)
  }
}

const onSearch = () => {
  loadAssets()
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

const viewAsset = (asset: any) => {
  currentAsset.value = asset
  viewDialogVisible.value = true
  
  if (asset.asset_type === '3D_Model') {
    nextTick(() => {
      load3DModelInDialog()
    })
  }
}

const closeViewDialog = () => {
  // Cleanup 3D scene
  if (currentAsset.value?.asset_type === '3D_Model' && dialog3DContainer.value) {
    while (dialog3DContainer.value.firstChild) {
      dialog3DContainer.value.removeChild(dialog3DContainer.value.firstChild)
    }
  }
  
  viewDialogVisible.value = false
  currentAsset.value = null
}

const downloadAsset = (asset: any) => {
  window.open(asset.url, '_blank')
  toast.add({
    severity: 'success',
    summary: 'Download Started',
    detail: `Downloading ${asset.file_name}`,
    life: 2000
  })
}

const confirmDelete = (asset: any) => {
  currentAsset.value = asset
  deleteDialogVisible.value = true
}

const deleteAsset = async () => {
  deleting.value = true
  try {
    await merchandisingService.deleteAsset(currentAsset.value.id)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Asset deleted successfully',
      life: 3000
    })
    deleteDialogVisible.value = false
    loadAssets()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to delete asset',
      life: 3000
    })
  } finally {
    deleting.value = false
  }
}

const bulkDeleteAssets = async () => {
  if (selectedAssets.value.length === 0) return

  try {
    for (const assetId of selectedAssets.value) {
      await merchandisingService.deleteAsset(assetId)
    }

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `${selectedAssets.value.length} assets deleted`,
      life: 3000
    })

    selectedAssets.value = []
    loadAssets()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete some assets',
      life: 3000
    })
  }
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/placeholder-image.png' // Add a placeholder image
}

const getAssetTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    '3D_Model': '3D Model',
    'Image_Main': 'Main Image',
    'Image_Gallery': 'Gallery',
    'Video_Product': 'Video',
    'Manual_PDF': 'PDF'
  }
  return labels[type] || type
}

const getAssetTypeSeverity = (type: string) => {
  const severities: Record<string, string> = {
    '3D_Model': 'info',
    'Image_Main': 'success',
    'Image_Gallery': 'primary',
    'Video_Product': 'warning',
    'Manual_PDF': 'danger'
  }
  return severities[type] || 'secondary'
}

const getAssetIcon = (type: string) => {
  const icons: Record<string, string> = {
    '3D_Model': 'pi pi-cube',
    'Image_Main': 'pi pi-image',
    'Image_Gallery': 'pi pi-images',
    'Video_Product': 'pi pi-video',
    'Manual_PDF': 'pi pi-file-pdf'
  }
  return icons[type] || 'pi pi-file'
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const formatDate = (date: string) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Cleanup on unmount
onBeforeUnmount(() => {
  modelScenes.value.forEach((sceneData) => {
    sceneData.renderer.dispose()
    sceneData.controls.dispose()
  })
  modelScenes.value.clear()
  modelContainers.value.clear()
})

onMounted(() => {
  loadProducts()
  loadAssets()
})
</script>

<style scoped>
.aspect-video {
  aspect-ratio: 16 / 9;
}

/* Ensure 3D containers have proper sizing */
:deep(canvas) {
  display: block;
  max-width: 100%;
  max-height: 100%;
}
</style>