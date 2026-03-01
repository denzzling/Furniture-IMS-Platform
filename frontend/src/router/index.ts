import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HumanResourcesLayout from '../layouts/HumanResourcesLayout.vue'
import { useAuthStore } from '../stores/auth'
import InventoryLayout from '../layouts/InventoryLayout.vue'

// Lazy load components for better performance
const Home = () => import('../views/marketing/Home.vue')
const Login = () => import('../views/auth/Login.vue')
const Dashboard = () => import('../views/system/storeAdmin/Dashboard.vue')
const About = () => import('../views/marketing/About.vue')
const Pricing = () => import('../views/marketing/Pricing.vue')
const Register = () => import('../views/auth/Register.vue')
const Unauthorized = () => import('../views/Unauthorized.vue')
const VerifyOtp = () => import('../views/auth/VerifyOtp.vue')
const Verification = () => import('../views/auth/VerifyStore.vue')

// Import the AdminLayout (your sidebar parent component)
const StoreAdminLayout = () => import('../layouts/StoreAdminLayout.vue')
const AdminLayout = () => import('../layouts/AdminLayout.vue')
// const ManagerLayout = () => import('../layouts/ManagerLayout.vue')
// const ThreeDManagerLayout = () => import('../layouts/3DManagerLayout.vue')
// const SupplierManagerLayout = () => import('../layouts/SupplierManagerLayout.vue')
// const AccountingLayout = () => import('../layouts/AccountingLayout.vue')
// const HRLayout = () => import('../layouts/HumanResourcesLayout.vue')
// const SalesLayout = () => import('../layouts/SalesLayout.vue')
// const InventoryLayout = () => import('../layouts/InventoryLayout.vue')
// const CustomerLayout = () => import('../layouts/CustomerLayout.vue')

// Admin Routes
const AdminDashboard = () => import('../views/system/admin/Dashboard.vue')
const AdminSubscription = () => import('../views/system/admin/Subscriptions.vue')
const AdminStoreValidation = () => import('../views/system/admin/Storevalidation.vue')
const AdminCustomerValidation = () => import('../views/system/admin/Customervalidation.vue')

// Store Admin Views
// const Sales = () => import('../views/system/inventory/Sales.vue')
// const Transactions = () => import('../views/system/sales/Transactions.vue')
// const Purchases = () => import('../views/system/inventory/Purchases.vue')
// const Users = () => import('../views/system/storeAdmin/Users.vue')
// const Products = () => import('../views/system/inventory/Products.vue')
// const Orders = () => import('../views/system/inventory/Orders.vue')
// const Inventory = () => import('../views/system/inventory/Inventory.vue')
// const Suppliers = () => import('../views/system/inventory/Suppliers.vue')
// const ProductRegistration = () => import('../views/system/inventory/ProductRegistration.vue')

// HR Views
const HrDashboard = () => import('../views/system/hr/index.vue')

// Stores
const StoreRegister = () => import('../views/system/store/Registration.vue')


// Routes
const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: Home, meta: { requiresGuest: true } },
  { path: '/login', name: 'Login', component: Login, meta: { requiresGuest: true } },
  { path: '/register', name: 'Register', component: Register, meta: { requiresGuest: true } },
  { path: '/about', name: 'About', component: About, meta: { requiresGuest: true } },
  { path: '/pricing', name: 'Pricing', component: Pricing, meta: { requiresGuest: true } },
  { path: '/verify-otp', name: 'VerifyOtp', component: VerifyOtp, meta: { requiresGuest: true, title: 'Verify Email' } },

  {
    path: '/system',
    component: StoreAdminLayout,
    meta: { requiresAuth: true, role: ['store_admin'] },
    children: [
      { path: 'index', name: 'store.dashboard', component: Dashboard, meta: { title: 'Dashboard' } },
      // { path: 'sales', name: 'Sales', component: Sales, meta: { title: 'Sales & Reports' } },
      // { path: 'transactions', name: 'Transactions', component: Transactions, meta: { title: 'Transactions', subtitle: 'Customer Transactions History' } },
      // { path: 'purchases', name: 'Purchases', component: Purchases, meta: { title: 'Purchases', subtitle: 'Inventory Purchases & Supplier Orders' } },
      // { path: 'products', name: 'Products', component: Products, meta: { title: 'Products', subtitle: 'Furniture Products Catalog' } },
      // { path: 'orders', name: 'Orders', component: Orders, meta: { title: 'Orders', subtitle: 'Customer Orders Management' } },
      // { path: 'inventory', name: 'Inventory', component: Inventory, meta: { title: 'Inventory', subtitle: 'Stock Levels & Warehouse Management' } },
      // { path: 'suppliers', name: 'Suppliers', component: Suppliers, meta: { title: 'Suppliers', subtitle: 'Supplier Information & Contracts' } },
      // { path: 'users', name: 'Users', component: Users, meta: { title: 'Users', subtitle: 'User Management & Permissions' } },
      // { path: 'productRegistration', name: 'ProductRegistration', component: ProductRegistration },
      // { path: 'profile', name: 'ProductRegistration', component: ProductRegistration },
      {
        path: 'store',
        children: [
          { path: 'verification', name: 'StoreVerification', component: Verification, meta: { title: 'Store Verification' } },
        ]
      }
    ]
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: {
      requiresAuth: true, role: ['super_admin']
    },
    children: [
      { path: 'dashboard', name: 'AdminDashboard', component: AdminDashboard, meta: { title: 'Dashboard' } },
      { path: 'subscription', name: 'AdminSubscription', component: AdminSubscription },
      { path: 'store-validation', name: 'AdminStoreValidation', component: AdminStoreValidation },
      { path: 'customer-validation', name: 'AdminCustomerValidation', component: AdminCustomerValidation },
    ]
  },
  {
    path: '/hr',
    component: HumanResourcesLayout,
    meta: {
      requiresAuth: true,
      preload: true, // Mark this as a preload route
      cache: true, // Enable caching for this section }, // Uncomment when ready
      role: ['hr_manager']
    },
    children: [
      // Dashboard
      {
        path: 'index',
        name: 'hr.dashboard',
        component: HrDashboard,
        meta: { title: 'HR Dashboard' }
      },
      // Employees
      {
        path: 'employees',
        children: [
          {
            path: '',
            name: 'hr.employees',
            component: () => import('../views/system/hr/Employees.vue'),
            meta: { title: 'Employees' }
          },
          {
            path: 'view/:id?',
            name: 'hr.employees.view',
            component: () => import('../views/system/hr/EmployeeView.vue'),
            meta: { title: 'View Employee' }
          },
          // {
          //   path: 'create',
          //   name: 'hr.employees.create',
          //   component: () => import('../views/system/hr/EmployeeCreate.vue'),
          //   meta: { title: 'Create Employee' }
          // },
          // {
          //   path: 'edit/:id',
          //   name: 'hr.employees.edit',
          //   component: () => import('../views/system/hr/EmployeeEdit.vue'),
          //   meta: { title: 'Edit Employee' }
          // },
        ]
      },

      // Shifts (Fixed duplicate path issue)
      {
        path: 'shifts',
        children: [
          {
            path: '',
            name: 'hr.shifts',
            component: () => import('../views/system/hr/Shift.vue'),
            meta: { title: 'Shift Management' }
          },
          {
            path: 'employees',
            name: 'hr.shifts.employees',
            component: () => import('../views/system/hr/EmployeeShifts.vue'),
            meta: { title: 'Employee Shifts' }
          },
          {
            path: 'create',
            name: 'hr.shifts.create',
            component: () => import('../views/system/hr/CreateShift.vue'),
            meta: { title: 'Create Shift' }
          },
          // {
          //   path: 'edit/:id',
          //   name: 'hr.shifts.edit',
          //   component: () => import('../views/system/hr/EditShift.vue'),
          //   meta: { title: 'Edit Shift' }
          // },
        ]
      },

      // Attendance
      {
        path: 'attendance',
        name: 'hr.attendance',
        component: () => import('../views/system/hr/Attendance.vue'),
        meta: { title: 'Attendance' }
      },

      // Departments
      {
        path: 'departments',
        name: 'hr.departments',
        component: () => import('../views/system/hr/Department.vue'),
        meta: { title: 'Departments' }
      },

      // Leave Management
      {
        path: 'leave-management',
        name: 'hr.leave',
        component: () => import('../views/system/hr/LeaveManagement.vue'),
        meta: { title: 'Leave Management' }
      },
      {
        path: 'leave-balances',
        name: 'hr.leave.balances',
        component: () => import('../views/system/hr/LeaveBalances.vue'),
        meta: { title: 'Leave Balances' }
      },

      // Analytics
      {
        path: 'analytics',
        name: 'hr.analytics',
        component: () => import('../views/system/hr/Analytics.vue'),
        meta: { title: 'Analytics' }
      },

      // Settings (Fixed typo: Seetings -> Settings)
      {
        path: 'settings',
        name: 'hr.settings',
        component: () => import('../views/system/hr/Settings.vue'),
        meta: { title: 'Settings' }
      },

      // Payroll
      {
        path: 'payroll',
        children: [
          {
            path: '',
            name: 'hr.payroll',
            component: () => import('../views/system/hr/PayrollList.vue'),
            meta: { title: 'Payroll' }
          },
          {
            path: 'overview',
            name: 'hr.payroll.overview',
            component: () => import('../views/system/hr/PayrollOverview.vue'),
            meta: { title: 'Payroll Overview' }
          },
          {
            path: 'periods',
            name: 'hr.payroll.periods',
            component: () => import('../views/system/hr/PayPeriods.vue'),
            meta: { title: 'Pay Periods' }
          },
          {
            path: 'lists',
            name: 'hr.payroll.list',
            component: () => import('../views/system/hr/PayrollList.vue'),
            meta: { title: 'Edit Payroll' }
          },
          {
            path: 'create',
            name: 'hr.payroll.create',
            component: () => import('../views/system/hr/PayrollCreate.vue'),
            meta: { title: 'Generate Payroll' }
          },
          {
            path: 'view/:id',
            name: 'hr.payroll.view',
            component: () => import('../views/system/hr/PayrollView.vue'),
            meta: { title: 'View Payroll' }
          },
          {
            path: 'edit/:id',
            name: 'hr.payroll.edit',
            component: () => import('../views/system/hr/PayrollEdit.vue'),
            meta: { title: 'Edit Payroll' }
          },
        ]
      },

      // Redirect for any unmatched HR routes
      {
        path: ':pathMatch(.*)*',
        redirect: { name: 'hr.dashboard' }
      }
    ]
  },
  {
    path: '/procurement',
    component: () => import('../layouts/ProcurementLayout.vue'),
    meta: {
      requiresAuth: true,
      role: ['']
    }
  },
  {
    path: '/inventory',
    component: InventoryLayout,
    children: [

    ]
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: Unauthorized,
    meta: {
      requiresAuth: false // ADDED: Explicitly mark as not requiring auth
    }
  },
  // {
  //   path: '/reset',
  //   name: 'Reset',
  //   component: () => import('../views/auth/Reset.vue')
  // },

  // Redirect old dashboard route to new system structure
  {
    path: '/dashboard',
    redirect: '/system'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  console.log('Navigation guard - Start:', {
    to: to.path,
    requiresAuth: to.meta.requiresAuth,
    requiresGuest: to.meta.requiresGuest,
    role: to.meta.role
  })

  const authStore = useAuthStore()
  const token = authStore.token
  const isAuthenticated = authStore.isAuthenticated
  const userRole = authStore.userRole

  // Debug logging
  console.log('Auth store data:', {
    isAuthenticated,
    userRole,
    token,
    user: authStore.user
  })

  // 1. Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('❌ Redirecting to login - requires auth but not authenticated')
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // 2. Check role-based access for protected routes
  if (to.meta.requiresAuth && to.meta.role) {
    const allowedRoles = Array.isArray(to.meta.role) ? to.meta.role : [to.meta.role]

    console.log('🔐 Role check:', {
      userRole,
      allowedRoles,
      isAllowed: allowedRoles.includes(userRole)
    })

    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log(`❌ Access denied: User role "${userRole}" not in allowed roles ${JSON.stringify(allowedRoles)}`)
      next({ name: 'Unauthorized' })
      return
    }

    console.log('✅ Role check passed')
  }

  // 3. Redirect authenticated users away from guest/auth pages
  const isGuestRoute = to.meta.requiresGuest ||
    to.path === '/login' ||
    to.path === '/register' ||
    to.path === '/verify-otp' ||
    to.path === '/reset'

  if (isGuestRoute && isAuthenticated) {
    console.log('Redirecting authenticated user from guest route:', to.path)

    // Role-based redirect using switch
    let redirectTo

    switch (userRole) {
      case 'super_admin':
        redirectTo = 'admin.dashboard'
        break
      case 'store_admin':
        redirectTo = 'store.dashboard'
        break
      case 'store_manager':
        redirectTo = 'manager.dashboard'
        break
      case 'hr_manager':
        redirectTo = 'hr.dashboard'
        break
      default:
        redirectTo = 'Login'
    }

    console.log(`➡️ Redirecting to: ${redirectTo}`)
    next({ name: redirectTo })
    return // ✅ CRITICAL: Stop execution here
  }

  // 4. Allow navigation (only reaches here if no redirects happened)
  console.log('✅ Allowing navigation to:', to.path)
  next() // Only called once at the end
})

export default router