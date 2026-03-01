<!-- Unauthorized.vue -->
<template>
  <div class="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4">
    <!-- Main Card -->
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center transform transition-all duration-300 hover:shadow-2xl">
      <!-- Icon Container -->
      <div class="relative mb-6">
        <div class="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-red-100">
          <i class="pi pi-lock text-4xl text-red-500"></i>
        </div>
        <!-- Optional decorative element -->
        <div class="absolute -top-2 -right-2 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
          <i class="pi pi-exclamation-triangle text-yellow-600"></i>
        </div>
      </div>

      <!-- Header -->
      <h1 class="text-3xl font-bold text-gray-800 mb-3">
        Access Denied
      </h1>
      
      <!-- Message -->
      <p class="text-gray-600 mb-2">
        You don't have permission to access this page.
      </p>
      
      <!-- Additional info about current role -->
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-8">
        <i class="pi pi-user text-blue-500"></i>
        <span class="text-sm font-medium text-blue-700">
          Current Role: <span class="font-bold">{{ authStore.userRole || 'None' }}</span>
        </span>
      </div>

      <!-- Action Buttons Container -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <!-- Dashboard Button -->
        <router-link 
          to="/dashboard"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <i class="pi pi-home"></i>
          Go to Dashboard
        </router-link>
        
        <!-- Logout Button -->
        <Button 
          @click="handleLogout"
          severity="danger"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          :loading="isLoggingOut"
          :disabled="isLoggingOut"
        >
          <i class="pi pi-sign-out" :class="{ 'hidden': isLoggingOut }"></i>
          <i class="pi pi-spin pi-spinner" v-if="isLoggingOut"></i>
          {{ isLoggingOut ? 'Logging out...' : 'Logout' }}
        </Button>
      </div>

      <!-- Additional Help Text -->
      <p class="text-sm text-gray-500 mt-8 pt-6 border-t border-gray-100">
        Need different access? Contact your administrator.
      </p>
    </div>

    <!-- Optional: Back to home link -->
    <router-link 
      to="/" 
      class="inline-flex items-center gap-2 mt-8 text-gray-500 hover:text-primary-600 transition-colors duration-200"
    >
      <i class="pi pi-arrow-left"></i>
      <span class="text-sm font-medium">Back to Home</span>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const authStore = useAuthStore();
const isLoggingOut = ref(false);

// Debug info (consider removing in production)
console.log('User Role:', authStore.userRole);

const handleLogout = async () => {
  isLoggingOut.value = true;
  
  // Debug logs (consider removing in production)
  console.log('1. Current token before logout:', authStore.token);
  console.log('2. Current localStorage:', {
    auth_token: localStorage.getItem('auth_token'),
    user: localStorage.getItem('user')
  });

  try {
    // Optional: Uncomment if you have a logout endpoint
    // await axios.post('/api/auth/logout');
    
    // Clear auth store
    authStore.logout();
    
    // Clear axios authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    // Navigate to login
    router.replace('/login');
    
  } catch (error) {
    console.error('Logout error:', error);
    
    // Emergency cleanup
    localStorage.clear();
    sessionStorage.clear();
    delete axios.defaults.headers.common['Authorization'];
    
    // Still navigate to login even if API fails
    router.replace('/login');
  } finally {
    isLoggingOut.value = false;
  }
};
</script>

<style scoped>
/* Custom animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.unauthorized {
  animation: fadeIn 0.5s ease-out;
}

/* Custom hover effects */

</style>