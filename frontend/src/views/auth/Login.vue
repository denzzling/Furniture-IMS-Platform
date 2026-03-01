<template>
  <LoginForm :is-submitting="isSubmitting" @submit="handleLogin" @error="handleFormError" />
</template>

<script setup lang="ts">
import LoginForm from '../../components/auth/LoginForm.vue';
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useRoute, useRouter } from 'vue-router'
import { LoginFormData } from '../../components/auth/LoginForm.vue'
import { useAuthStore } from '../../stores/auth';

const route = useRoute()
const toast = useToast()
const router = useRouter()
const authStore = useAuthStore()
const isSubmitting = ref(false)

const handleLogin = async (formData: LoginFormData) => {
  if (isSubmitting.value) {
    console.log('Already submitting, ignoring...')
    return
  }

  isSubmitting.value = true

  try {
    // Let authStore handle the entire login process
    const response = await authStore.login(formData.email, formData.password)

    console.log('Login response:', response)
    console.log('User role:', authStore.user?.role)
    console.log('User data:', authStore.user)
    console.log('Access token:', authStore.token)

    toast.add({
      severity: 'success',
      summary: 'Login Successful!',
      detail: 'Redirecting to dashboard...',
      life: 3000
    })

    // Role-based dashboard routing
    let redirectTo = '/unauthorized' // default

    switch (authStore.user?.role) {
      case "super_admin":
        redirectTo = 'AdminDashboard'
        break
      case "store_admin":
        redirectTo = 'store.dashboard'
        break
      case "store_manager":
        redirectTo = 'ManagerDashboard'
        break
      case "hr_manager":
        redirectTo = 'hr.dashboard'
        break
      default:
        redirectTo = 'Login'
    }

    // Then use it with router
    router.push({ name: redirectTo })

    // Check for query redirect (only if not already determined by role)
    if (redirectTo === '/unauthorized' && route.query.redirect) {
      redirectTo = route.query.redirect as string
    }

    setTimeout(() => {
      router.push(redirectTo)
    }, 1500)

  } catch (error: any) {
    console.error('Login error:', error)

    // Handle validation errors
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors

      // Show first error in toast
      if (errors && Object.keys(errors).length > 0) {
        const firstError = Object.values(errors)[0][0]
        toast.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: firstError,
          life: 5000
        })
      }
    } else {
      // General error
      toast.add({
        severity: 'error',
        summary: 'Login Failed',
        detail: error.response?.data?.message || error.message || 'Something went wrong. Please try again.',
        life: 5000
      })
    }
    throw error
  } finally {
    isSubmitting.value = false
  }
}

const handleFormError = (errorMessage: string) => {
  toast.add({
    severity: 'warn',
    summary: 'Form Error',
    detail: errorMessage,
    life: 3000
  })
}
</script>