<!-- layouts/SystemLayout.vue -->
<template>
    <div class="flex h-screen w-full max-w-[200vw] overflow-hidden">
        <!-- Sidebar -->
        <aside class="sidebar bg-gray-50 w-64 shadow-lg flex flex-col z-30 overflow-y-auto">
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
                    <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Main Menu</div>
    
                    <router-link v-for="item in menuItems" :key="item.to" :to="item.to"
                        class="text-sm font-medium flex items-center space-x-3 py-3 px-4 rounded-lg text-black hover:bg-white hover:shadow transition-colors">
                        <i :class="item.icon"></i>
                        <span>{{ item.label }}</span>
                    </router-link>
                </div>
            </nav>
        </aside>
    
        <!-- Main content -->
        <div class="flex-1 flex flex-col h-screen">
            <!-- Top header -->
            <header class="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between sticky top-0 z-20">
                <div>
                    <h1 class="font-semibold text-xl text-gray-800">
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
            <main class="flex-1 overflow-y-auto p-5 bg-white">
                <router-view />
            </main>
        </div>
    </div>
    
    <UserDialog ref="userDialogRef"/>
</template>


<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { startCase, toLower } from 'lodash'
import UserDialog from '../components/dialogs/UserDialog.vue';


const userDialogRef = ref(null);
const route = useRoute()


const openUserDialog = (event) => {
    userDialogRef.value.toggle(event);
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

const firstName = startCase(toLower(user?.fname)) || 'Cash'
const lastName = startCase(toLower(user?.lname)) || 'Gshock'
const role = startCase(user?.role)

// Updated menu for furniture management system
const menuItems = [
  { to: "1", label: "Dashboard", icon: "pi pi-home text-gray-500 w-5" },
  { to: "2", label: "Stock Control", icon: "pi pi-box text-gray-500 w-5" },
  { to: "3", label: "Receiving", icon: "pi pi-download text-gray-500 w-5" },
  { to: "4", label: "Fulfillment", icon: "pi pi-send text-gray-500 w-5" },
  { to: "5", label: "3D Viewer", icon: "pi pi-globe text-gray-500 w-5" },
  { to: "6", label: "Alerts", icon: "pi pi-bell text-gray-500 w-5" },
  { to: "7", label: "Quality", icon: "pi pi-check-circle text-gray-500 w-5" },
  { to: "8", label: "Settings", icon: "pi pi-cog text-gray-500 w-5" },
];



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
    background-color: white;
    box-shadow: 0px 0px 4px 1px rgba(0, 0, 0, .1);
    /* color: #2563eb; */
    font-weight: 600;
}

.router-link-active i {
    color: black;
}

.sidebar {
    transition: all 0.3s ease;
}
</style>