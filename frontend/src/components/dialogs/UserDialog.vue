<template>
  <OverlayPanel ref="op">
  
    <div class="flex flex-col min-w-35">
  
      <!-- Profile -->
      <Button class="w-full text-left" variant="text" size="small" icon="pi pi-user" severity="secondary" label="Profile"
        @click="goProfile"/>
      <div class="border-t border-gray-200"></div>
      <!-- Logout -->
      <Button class="w-full text-left" variant="text" icon="pi pi-power-off" size="small" severity="secondary" label="Logout"
        @click="handleLogout"/>
    </div>
  </OverlayPanel>
  
  <Dialog v-model:visible="isLoggingOut" modal :closable="false" :showHeader="false" :style="{ width: '350px' }">
    <div class="flex flex-col items-center justify-center p-6">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" fill="transparent" animationDuration=".5s" />
      <p class="mt-4 text-lg font-medium text-gray-700">Logging you out...</p>
      <p class="text-gray-500">Please wait a moment</p>
    </div>
  </Dialog>
</template>

<script setup lang=ts>
import OverlayPanel from "primevue/overlaypanel";
import { ref, defineExpose } from "vue";
import { useAuthStore } from "../../stores/auth";
import { useRouter } from "vue-router";
import axios from "axios";

const authStore = useAuthStore()
const router = useRouter()
const op = ref(null);
const isLoggingOut = ref<boolean>(false)

/* EXPOSED METHODS */
const toggle = (event) => {
  op.value.toggle(event);
};

const show = (event) => {
  op.value.show(event);
};

const hide = () => {
  op.value.hide();
};

/* ACTIONS */
const goProfile = () => {
  hide();
  window.location.href = "/profile";
};

const handleLogout = async () => {
  isLoggingOut.value = true

  try {
    console.log('LOGGING OUT.... 1. Current token before logout:', authStore.token)
    console.log('2. Current localStorage:', {
      auth_token: localStorage.getItem('auth_token'),
      user: localStorage.getItem('user')
    })
    // await axios.post('/api/auth/logout')
    authStore.logout()
    delete axios.defaults.headers.common['Authorization']
    router.replace('/login')

  } catch (error) {
    console.error('Logout error:', error)

    // Emergency cleanup
    localStorage.clear()
    sessionStorage.clear()
    delete axios.defaults.headers.common['Authorization']
  } finally {
    isLoggingOut.value = false
  }
}

defineExpose({
  toggle,
  show,
  hide,
});
</script>
