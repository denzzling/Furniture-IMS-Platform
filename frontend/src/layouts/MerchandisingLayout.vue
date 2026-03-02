<template>
    <div class="flex h-screen w-full max-w-[100vw] overflow-hidden bg-gray-50">
        <!-- Sidebar -->
        <aside class="sidebar bg-white w-64 flex flex-col z-30 overflow-y-auto border-r border-gray-200">
            <!-- Logo section -->
            <div class="px-5 py-4 border-b border-gray-200">
                <div class="flex items-center gap-3">
                    <!-- Logo / Icon -->
                    <div class="flex items-center justify-center w-10 h-10 rounded-lg">
                        <!-- Optional image -->
                        <img src="../../public/F.svg" alt="Furnisync" class="w-20 h-20">
                    </div>
    
                    <!-- Brand Text -->
                    <div class="leading-tight" style="font-family: 'Poppins'">
                        <h1 class="text-lg font-semibold text-gray-900">
                            Furnisync
                        </h1>
                        <p class="text-xs text-gray-600">Merchandising</p>
                    </div>
                </div>
            </div>
    
            <!-- Navigation -->
            <nav class="flex-1 overflow-y-auto py-4">
                <!-- Main Menu -->
                <div v-if="productMenu.length > 0" class="px-4 space-y-1 pb-4">
                    <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-3 mb-3">
                        Product Management
                    </div>
                    <router-link v-for="item in productMenu" :key="item.route_path" :to="item.route_path"
                        class="nav-item text-sm font-medium flex items-center space-x-3 py-3 px-4 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <i :class="[item.icon, 'w-5']"></i>
                        <span>{{ item.display_name }}</span>
                    </router-link>
                </div>
    
                <!-- Catalog Settings -->
                <div v-if="catalogMenu.length > 0" class="px-4 space-y-1 pb-4 border-t border-gray-200 pt-4">
                    <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-3 mb-3">
                        Catalog Settings
                    </div>
                    <router-link v-for="item in catalogMenu" :key="item.route_path" :to="item.route_path"
                        class="nav-item text-sm font-medium flex items-center space-x-3 py-3 px-4 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <i :class="[item.icon, 'w-5']"></i>
                        <span>{{ item.display_name }}</span>
                    </router-link>
                </div>
    
                <!-- Analytics & Reports -->
                <div v-if="analyticsMenu.length > 0" class="px-4 space-y-1 pb-4 border-t border-gray-200 pt-4">
                    <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-3 mb-3">
                        Analytics
                    </div>
                    <router-link v-for="item in analyticsMenu" :key="item.route_path" :to="item.route_path"
                        class="nav-item text-sm font-medium flex items-center space-x-3 py-3 px-4 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <i :class="[item.icon, 'w-5']"></i>
                        <span>{{ item.display_name }}</span>
                    </router-link>
                </div>
    
                <!-- Empty State -->
                <div v-if="!hasAnyNavigation" class="px-4 py-8 text-center">
                    <i class="pi pi-inbox text-4xl text-gray-300 mb-3"></i>
                    <p class="text-sm text-gray-500">No menu items available</p>
                </div>
            </nav>
        </aside>
    
        <!-- Main content -->
        <div class="flex-1 flex flex-col h-screen overflow-hidden">
            <!-- Top header -->
            <header
                class="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div class="flex-1">
                    <div class="flex items-center gap-3">
                        <Button icon="pi pi-bars" text rounded class="lg:hidden" @click="toggleSidebar" />
                        <div>
                            <h1 class="text-xl font-semibold text-gray-800">
                                {{ route.meta.title || 'Product Catalog' }}
                            </h1>
                            <p class="text-sm text-gray-500">
                                {{ route.meta.subtitle || 'Manage your furniture inventory' }}
                            </p>
                        </div>
                    </div>
                </div>
    
                <!-- Header Actions -->
                <div class="flex items-center space-x-4">
                    <!-- Notifications -->
                    <Button icon="pi pi-bell" severity="secondary" text rounded badge="3" badgeSeverity="danger" />
    
                    <!-- Quick Actions Menu -->
                    <!-- <Button icon="pi pi-plus" label="Quick Add" severity="primary" @click="toggleQuickActions"
                        aria-haspopup="true" aria-controls="quick_actions_menu" />
                    <Menu id="quick_actions_menu" ref="quickActionsMenu" :model="quickActions" :popup="true" /> -->
    
                    <!-- User Profile -->
    
                    <div class="border-l border-gray-200 pl-4 cursor-pointer select-none" @click="openUserDialog">
                        <div class="flex items-center space-x-3 hover:bg-gray-50 px-2 py-1 rounded-lg transition">
                            <!-- Avatar -->
                            <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <i class="pi pi-user text-blue-600"></i>
                            </div>
                            <!-- Name + Role -->
                            <div>
                                <h2 class="font-semibold text-gray-800 text-sm">{{ fullName }}</h2>
                                <p class="text-xs text-gray-500">
                                    {{ roleDisplay }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
    
            <!-- Breadcrumb -->
            <div class="bg-white border-b border-gray-200 px-6 py-2">
                <nav class="flex items-center space-x-2 text-sm">
                    <router-link to="/system/index" class="text-gray-500 hover:text-blue-600">
                        <i class="pi pi-home"></i>
                    </router-link>
                    <i class="pi pi-angle-right text-gray-400 text-xs"></i>
                    <router-link to="/merchandising/products" class="text-gray-500 hover:text-blue-600">
                        Merchandising
                    </router-link>
                    <i class="pi pi-angle-right text-gray-400 text-xs"></i>
                    <span class="text-gray-800 font-medium">{{ route.meta.title }}</span>
                </nav>
            </div>
    
            <!-- Scrollable content -->
            <main class="flex-1 overflow-y-auto p-6 bg-gray-50">
                <router-view />
            </main>
        </div>
    </div>
    
    <UserDialog ref="userDialogRef" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { startCase, toLower } from 'lodash'
import Menu from 'primevue/menu'
import UserDialog from '../components/dialogs/UserDialog.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const userDialogRef = ref(null)


const openUserDialog = (event: MouseEvent) => {
  if (userDialogRef.value) {
    (userDialogRef.value as any).toggle(event);
  }
}

// User data
const fullName = computed(() => {
  const first = startCase(toLower(authStore.user?.first_name || ''))
  const last = startCase(toLower(authStore.user?.last_name || ''))
  return `${first} ${last}`.trim() || 'User'
})

const userInitials = computed(() => {
  const first = authStore.user?.first_name?.[0] || ''
  const last = authStore.user?.last_name?.[0] || ''
  return (first + last).toUpperCase()
})

const roleDisplay = computed(() => startCase(authStore.user?.role || 'User'))

// Get navigation from backend (filtered by permissions)
const productMenu = computed(() => {
  return authStore.navigation
    .filter(item =>
      item.module === 'merchandising' &&
      !item.parent_id &&
      ['dashboard', 'products', 'variations', 'assets', 'inventory'].some(key => item.name.includes(key))
    )
    .sort((a, b) => a.display_order - b.display_order)
})

const catalogMenu = computed(() => {
  return authStore.navigation
    .filter(item =>
      item.module === 'merchandising' &&
      !item.parent_id &&
      ['categories', 'attributes', 'tags', 'pricing'].some(key => item.name.includes(key))
    )
    .sort((a, b) => a.display_order - b.display_order)
})

const analyticsMenu = computed(() => {
  return authStore.navigation
    .filter(item =>
      item.module === 'merchandising' &&
      !item.parent_id &&
      ['reports', 'history'].some(key => item.name.includes(key))
    )
    .sort((a, b) => a.display_order - b.display_order)
})

const hasAnyNavigation = computed(() => {
  return productMenu.value.length > 0 ||
    catalogMenu.value.length > 0 ||
    analyticsMenu.value.length > 0
})

// Quick Actions Menu
const quickActionsMenu = ref()
const quickActions = ref([
  {
    label: 'Add Product',
    icon: 'pi pi-plus-circle',
    command: () => router.push({ name: 'merchandising.products.create' }),
    visible: () => authStore.hasPermission('merchandising.products.create')
  },
  {
    label: 'Add Category',
    icon: 'pi pi-sitemap',
    command: () => router.push({ name: 'merchandising.categories.create' }),
    visible: () => authStore.hasPermission('merchandising.categories.edit')
  },
  {
    label: 'Upload Asset',
    icon: 'pi pi-cloud-upload',
    command: () => router.push({ name: 'merchandising.assets.upload' }),
    visible: () => authStore.hasPermission('merchandising.assets.upload')
  },
  {
    separator: true
  },
  {
    label: 'Bulk Update Prices',
    icon: 'pi pi-dollar',
    command: () => router.push({ name: 'merchandising.pricing.bulk' }),
    visible: () => authStore.hasPermission('merchandising.pricing.edit')
  }
].filter(item => !item.visible || item.visible()))

const toggleQuickActions = (event: Event) => {
  quickActionsMenu.value.toggle(event)
}

// Sidebar toggle for mobile
const sidebarOpen = ref(true)
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

</script>

<style scoped>
.sidebar {
    transition: all 0.3s ease;
}

.nav-item {
    position: relative;
    overflow: hidden;
}

.nav-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 3px;
    background: #3b82f6;
    transform: scaleY(0);
    transition: transform 0.2s ease;
}

.nav-item:hover::before,
.router-link-active::before {
    transform: scaleY(1);
}

.router-link-active {
    background-color: #eff6ff;
    color: #2563eb;
    font-weight: 600;
}

.router-link-active i {
    color: #2563eb;
}

/* Mobile responsiveness */
@media (max-width: 1024px) {
    .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        height: 100vh;
        transform: translateX(-100%);
    }

    .sidebar.open {
        transform: translateX(0);
    }
}

/* Smooth scroll */
main {
    scroll-behavior: smooth;
}

/* Custom scrollbar */
.sidebar::-webkit-scrollbar,
main::-webkit-scrollbar {
    width: 6px;
}

.sidebar::-webkit-scrollbar-track,
main::-webkit-scrollbar-track {
    background: #f1f5f9;
}

.sidebar::-webkit-scrollbar-thumb,
main::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover,
main::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>