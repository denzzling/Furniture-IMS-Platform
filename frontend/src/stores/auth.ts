import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import router from '../router'

interface User {
  id: number
  user_id: string
  first_name: string
  last_name: string
  role: string
  email: string
  abilities?: string[]
}

interface NavigationItem {
  id: number
  name: string
  display_name: string
  module: string
  route_name: string
  route_path: string
  icon: string | null
  parent_id: number | null
  display_order: number
  meta: Record<string, any> | null
}

export const useAuthStore = defineStore('auth', () => {
  // ==========================================
  // STATE
  // ==========================================
  const token = ref(localStorage.getItem('auth_token'))
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'))
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // RBAC State
  const permissions = ref<string[]>([])
  const navigation = ref<NavigationItem[]>([])
  const permissionsLoaded = ref(false)

  // ==========================================
  // GETTERS
  // ==========================================
  const isAuthenticated = computed(() => !!token.value)
  const currentUser = computed(() => user.value)
  const userRole = computed(() => user.value?.role || null)
  const userAbilities = computed(() => user.value?.abilities || [])

  // Default route based on role
  const defaultRoute = computed(() => {
    switch (user.value?.role) {
      case 'super_admin':
        return '/admin/dashboard'
      case 'store_admin':
      case 'store_manager':
        return '/system/index'
      case 'hr_manager':
        return '/hr/index'
      case 'warehouse_manager':
      case 'inventory_staff':
        return '/merchandising/products'
      case 'sales_staff':
        return '/merchandising/products'
      default:
        return '/login'
    }
  })

  // ==========================================
  // RBAC ACTIONS
  // ==========================================
  
  /**
   * Load user permissions and navigation from backend
   */
  const loadPermissions = async () => {
    if (!token.value) {
      console.warn('⚠️ Cannot load permissions - no token')
      return
    }

    try {
      console.log('📥 Loading user permissions...')
      const response = await axios.get('/api/user/navigation')
      
      permissions.value = response.data.permissions || []
      navigation.value = response.data.navigation || []
      permissionsLoaded.value = true
      
      console.log('✅ Permissions loaded:', permissions.value.length, 'permissions')
      console.log('✅ Navigation loaded:', navigation.value.length, 'items')
    } catch (err: any) {
      console.error('❌ Failed to load permissions:', err)
      permissionsLoaded.value = false
      
      // If 401, token is invalid - logout
      if (err.response?.status === 401) {
        await logout()
      }
    }
  }

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    return permissions.value.includes(permission)
  }

  /**
   * Check if user has ANY of the permissions
   */
  const hasAnyPermission = (perms: string[]): boolean => {
    return perms.some(p => permissions.value.includes(p))
  }

  /**
   * Check if user has ALL permissions
   */
  const hasAllPermissions = (perms: string[]): boolean => {
    return perms.every(p => permissions.value.includes(p))
  }

  /**
   * Check if user has ability (legacy support)
   */
  const hasAbility = (ability: string): boolean => {
    return user.value?.abilities?.includes(ability) || false
  }

  /**
   * Get navigation items for a specific module
   */
  const getNavigationByModule = (module: string) => {
    return navigation.value
      .filter(item => item.module === module && !item.parent_id)
      .sort((a, b) => a.display_order - b.display_order)
  }

  /**
   * Get child navigation items
   */
  const getChildNavigation = (parentId: number) => {
    return navigation.value
      .filter(item => item.parent_id === parentId)
      .sort((a, b) => a.display_order - b.display_order)
  }

  // ==========================================
  // AUTH ACTIONS
  // ==========================================

  /**
   * Login user
   */
  const login = async (email: string, password: string) => {
    loading.value = true
    error.value = null

    try {
      // Get CSRF cookie
      await axios.get('/sanctum/csrf-cookie')

      // Make login request
      const response = await axios.post('/api/auth/login', {
        email,
        password,
        device_name: 'web_browser',
      })

      // Store token and user
      const accessToken = response.data.data?.access_token || response.data.token
      const userData = response.data.data?.user || response.data.user

      token.value = accessToken
      user.value = userData

      // Store in localStorage
      localStorage.setItem('auth_token', accessToken)
      localStorage.setItem('user', JSON.stringify(userData))

      // Set default Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

      // Load permissions immediately after login
      await loadPermissions()

      // Clock in Attendance
      try {
        const clockInResponse = await axios.post('/api/attendances/clock-in', {
          user_id: userData.id,
          method: 'web'
        })
        console.log('✅ Clock-in successful:', clockInResponse.data)
      } catch (clockInError) {
        console.warn('⚠️ Clock-in failed:', clockInError)
        // Don't block login if clock-in fails
      }

      return response

    } catch (err: any) {
      console.error('❌ Login error:', err)
      error.value = err.response?.data?.message || err.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      if (token.value && user.value) {
        await axios.post('/api/auth/logout-with-clock-out', {
          user_id: user.value.id,
          method: 'web'
        })
      }
    } catch (err) {
      console.warn('⚠️ Logout API error:', err)
    } finally {
      // Clear everything
      token.value = null
      user.value = null
      permissions.value = []
      navigation.value = []
      permissionsLoaded.value = false
      
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')

      // Clear Authorization header
      delete axios.defaults.headers.common['Authorization']

      // Clear all cookies
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })

      router.push({ name: 'Login' })
    }
  }

  /**
   * Fetch current user data
   */
  const fetchCurrentUser = async () => {
    if (!token.value) return

    try {
      const response = await axios.get('/api/auth/user')
      user.value = response.data
      localStorage.setItem('user', JSON.stringify(response.data))
      
      // Reload permissions when user data is refreshed
      await loadPermissions()
      
      return response.data
    } catch (err: any) {
      if (err.response?.status === 401) {
        await logout()
      }
      throw err
    }
  }

  /**
   * Initialize auth on app load
   */
  const initialize = async () => {
    if (token.value && user.value && !permissionsLoaded.value) {
      console.log('🔄 Initializing auth store...')
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      await loadPermissions()
    }
  }

  // ==========================================
  // RETURN PUBLIC API
  // ==========================================
  return {
    // State
    token,
    user,
    loading,
    error,
    permissions,
    navigation,
    permissionsLoaded,

    // Getters
    isAuthenticated,
    currentUser,
    userRole,
    userAbilities,
    defaultRoute,

    // Auth Actions
    login,
    logout,
    fetchCurrentUser,
    initialize,

    // Permission Actions
    loadPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasAbility,

    // Navigation Helpers
    getNavigationByModule,
    getChildNavigation,
  }
})