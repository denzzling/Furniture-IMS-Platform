<!-- layouts/SystemLayout.vue -->
<template>
    <div class="flex h-screen w-full max-w-[100vw] overflow-hidden">
        <!-- Sidebar -->
        <aside class="sidebar w-64 flex flex-col z-30 overflow-y-auto" style="background-color: #f0f3fa;">
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
                    </div>
                </div>
            </div>
    
            <!-- Navigation -->
            <nav class="flex-1 overflow-y-auto py-4">
                <div class="px-4 space-y-1 pb-4">
                    <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-3 mb-3">Menu</div>
    
                    <router-link v-for="item in adminMenu" :key="item.to" :to="item.to"
                        class="text-sm font-medium flex items-center space-x-3 py-3 px-4 rounded-lg text-gray-500 hover:bg-blue-50 transition-colors">
                        <i :class="item.icon"></i>
                        <span>{{ item.label }}</span>
                    </router-link>
                </div>
            </nav>
        </aside>
    
        <!-- Main content -->
        <div class="flex-1 flex flex-col h-screen">
            <!-- Top header -->
            <header class="py-3 px-6 flex items-center justify-between sticky top-0 z-20" style="background-color: #f0f3fa;">
                <div>
                    <h1 class="font-semibold text-lg text-gray-800">
                        {{ route.meta.title }}
                    </h1>
                    <p class="text-sm text-gray-400">
                        {{ route.meta.subtitle }}
                    </p>
                </div>
    
                <div class="flex items-center space-x-4">
                    <!-- CLICKABLE USER CARD -->
                    <div class="border-l border-gray-200 pl-4 cursor-pointer select-none" @click="openUserDialog">
                        <div class="flex items-center space-x-3 hover:bg-gray-50 px-2 py-1 rounded-lg transition">
                            <!-- Avatar -->
                            <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <i class="pi pi-user text-blue-600"></i>
                            </div>
                            <!-- Name + Role -->
                            <div>
                                <h2 class="font-semibold text-gray-800">
                                    {{ firstName }} {{ lastName }}
                                </h2>
                                <p class="text-xs text-gray-500">
                                    {{ role }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
    
            <!-- Scrollable content -->
            <main class="flex-1 overflow-y-auto p-5 bg-gray-50">
                <router-view />
            </main>
        </div>
    </div>
    
    <UserDialog ref="userDialogRef" />
</template>


<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth'
import { startCase, toLower } from 'lodash'
import UserDialog from '../components/dialogs/UserDialog.vue';

const route = useRoute()
const authStore = useAuthStore()
const router = useRouter()
const userDialogRef = ref(null)

const openUserDialog = (event: MouseEvent) => {
  if (userDialogRef.value) {
    (userDialogRef.value as any).toggle(event);
  }
}

type User = {
  id: number
  user_id: string
  fname: string
  lname: string
  role: string
  email: string
}

const userData = localStorage.getItem('user')
const user: User | null = userData ? JSON.parse(userData) as User : null

const firstName = startCase(toLower(authStore.user?.full_name))
const lastName = startCase(toLower(authStore.user?.lname))
const role = startCase(user?.role)

const registeredStore = ref<boolean>(false)

const checkStoreStatus = async () => {
  try {
    const storeData = !!authStore.user.store?.id
    registeredStore.value = storeData

    console.log(registeredStore.value)
    // Option 2: Or make an API call
    // const response = await axios.get('/api/store/status')
    // hasStore.value = response.data.hasStore
  } catch (error) {
    console.error('Error checking store status:', error)
  }
}

onMounted(() => {
  checkStoreStatus()
})

// Filtered menu based on hasStore
const adminMenu = computed(() => {
  if (registeredStore.value) {
    // Show all menu items when store exists
    return menuItems
  } else {
    // Show only Dashboard when no store
    return validationMenuItems
  }
})

// Optionally, watch for changes to registeredStore and redirect if it becomes null
watch(registeredStore, (newValue) => {
  if (!newValue) {
    router.push('/system/store/verification')
  }
})

// Optional: Show a store creation link in sidebar when no store
// const showStoreCreation = computed(() => !hasStore.value)



// Updated menu for furniture management system
const menuItems = [
  { to: "/system/dashboard", label: "Dashboard", icon: "pi pi-chart-line text-gray-500 w-5" },
  { to: "/system/sales", label: "Branches", icon: "pi pi-warehouse text-gray-500 w-5" },
  { to: "/system/transactions", label: "Users", icon: "pi pi-users  text-gray-500 w-5" },
  { to: "/system/purchases", label: "Products", icon: "pi pi-shopping-cart text-gray-500 w-5" },
  { to: "/system/products", label: "3D Product Overview", icon: "pi pi-box text-gray-500 w-5" },
  { to: "/system/orders", label: "Sales & Orders", icon: "pi pi-ticket text-gray-500 w-5" },
  { to: "/system/suppliers", label: "Suppliers", icon: "pi pi-building text-gray-500 w-5" },
  { to: "/system/users", label: "Subscription & Billing", icon: "pi pi-dollar text-gray-500 w-5" }
]

const validationMenuItems = [
  { to: "/system/dashboard", label: "Home" },
  { to: "/system/profile", label: "Profile" },
]

</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.router-link-active {
    background-color: #dbeafe;
    color: #2563eb;
    font-weight: 600;
}

.router-link-active span {
    color: #2563eb;
}

.router-link-active i {
    color: #2563eb;
}

.sidebar {
    transition: all 0.3s ease;
}
</style>