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
      { path: 'store', children: [{ path: 'verification', name: 'StoreVerification', component: Verification, meta: { title: 'Store Verification' } }] }
    ]
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, role: ['super_admin'] },
    children: [
      { path: 'dashboard', name: 'AdminDashboard', component: AdminDashboard, meta: { title: 'Dashboard' } },
      { path: 'roles-permissions', name: 'admin.role-permissions', component: () => import('../views/system/admin/RolePermissions.vue'), meta: { title: 'Role Permissions' } },
      { path: 'subscription', name: 'AdminSubscription', component: AdminSubscription },
      { path: 'store-validation', name: 'AdminStoreValidation', component: AdminStoreValidation },
      { path: 'customer-validation', name: 'AdminCustomerValidation', component: AdminCustomerValidation },
    ]
  },
  {
    path: '/hr',
    component: HumanResourcesLayout,
    meta: { requiresAuth: true, preload: true, cache: true, role: ['hr_manager'] },
    children: [
      { path: 'index', name: 'hr.dashboard', component: HrDashboard, meta: { title: 'HR Dashboard' } },
      {
        path: 'employees', children: [
          { path: '', name: 'hr.employees', component: () => import('../views/system/hr/Employees.vue'), meta: { title: 'Employees' } },
          { path: 'view/:id?', name: 'hr.employees.view', component: () => import('../views/system/hr/EmployeeView.vue'), meta: { title: 'View Employee' } },
          // { path: 'create', name: 'hr.employees.create', component: () => import('../views/system/hr/EmployeeCreate.vue'), meta: { title: 'Create Employee' } },
          // { path: 'edit/:id', name: 'hr.employees.edit', component: () => import('../views/system/hr/EmployeeEdit.vue'), meta: { title: 'Edit Employee' } },
        ]
      },
      {
        path: 'shifts', children: [
          { path: '', name: 'hr.shifts', component: () => import('../views/system/hr/Shift.vue'), meta: { title: 'Shift Management' } },
          { path: 'employees', name: 'hr.shifts.employees', component: () => import('../views/system/hr/EmployeeShifts.vue'), meta: { title: 'Employee Shifts' } },
          { path: 'create', name: 'hr.shifts.create', component: () => import('../views/system/hr/CreateShift.vue'), meta: { title: 'Create Shift' } },
          // { path: 'edit/:id', name: 'hr.shifts.edit', component: () => import('../views/system/hr/EditShift.vue'), meta: { title: 'Edit Shift' } },
        ]
      },
      { path: 'attendance', name: 'hr.attendance', component: () => import('../views/system/hr/Attendance.vue'), meta: { title: 'Attendance' } },
      { path: 'departments', name: 'hr.departments', component: () => import('../views/system/hr/Department.vue'), meta: { title: 'Departments' } },
      { path: 'leave-management', name: 'hr.leave', component: () => import('../views/system/hr/LeaveManagement.vue'), meta: { title: 'Leave Management' } },
      { path: 'leave-balances', name: 'hr.leave.balances', component: () => import('../views/system/hr/LeaveBalances.vue'), meta: { title: 'Leave Balances' } },
      { path: 'analytics', name: 'hr.analytics', component: () => import('../views/system/hr/Analytics.vue'), meta: { title: 'Analytics' } },
      { path: 'settings', name: 'hr.settings', component: () => import('../views/system/hr/Settings.vue'), meta: { title: 'Settings' } },
      {
        path: 'payroll', children: [
          { path: '', name: 'hr.payroll', component: () => import('../views/system/hr/PayrollList.vue'), meta: { title: 'Payroll' } },
          { path: 'overview', name: 'hr.payroll.overview', component: () => import('../views/system/hr/PayrollOverview.vue'), meta: { title: 'Payroll Overview' } },
          { path: 'periods', name: 'hr.payroll.periods', component: () => import('../views/system/hr/PayPeriods.vue'), meta: { title: 'Pay Periods' } },
          { path: 'lists', name: 'hr.payroll.list', component: () => import('../views/system/hr/PayrollList.vue'), meta: { title: 'Edit Payroll' } },
          { path: 'create', name: 'hr.payroll.create', component: () => import('../views/system/hr/PayrollCreate.vue'), meta: { title: 'Generate Payroll' } },
          { path: 'view/:id', name: 'hr.payroll.view', component: () => import('../views/system/hr/PayrollView.vue'), meta: { title: 'View Payroll' } },
          { path: 'edit/:id', name: 'hr.payroll.edit', component: () => import('../views/system/hr/PayrollEdit.vue'), meta: { title: 'Edit Payroll' } },
        ]
      },
      { path: ':pathMatch(.*)*', redirect: { name: 'hr.dashboard' } }
    ]
  },
  {
    path: '/merchandising',
    component: () => import('../layouts/MerchandisingLayout.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'store_admin', 'store_manager', 'warehouse_manager', 'inventory_staff', 'sales_staff', 'supplier_coordinator'] },
    children: [
      { path: 'dashboard', name: 'merchandising.dashboard', component: () => import('../views/system/merchandising/Dashboard.vue'), meta: { title: 'Product Catalog Dashboard', subtitle: 'Overview of your product catalog and inventory', roles: ['super_admin', 'store_admin', 'store_manager', 'warehouse_manager'], permissions: ['merchandising.dashboard.view'] } },
      { path: 'products', name: 'merchandising.products', component: () => import('../views/system/merchandising/products/ProductsList.vue'), meta: { title: 'All Products', subtitle: 'Manage your furniture product catalog', roles: ['super_admin', 'store_admin', 'store_manager', 'warehouse_manager', 'inventory_staff', 'sales_staff', 'supplier_coordinator'], permissions: ['merchandising.products.view'] } },
      { path: 'products/new', name: 'merchandising.products.create', component: () => import('../views/system/merchandising/products/ProductForm.vue'), meta: { title: 'Add New Product', subtitle: 'Create a new furniture product', roles: ['super_admin', 'store_admin', 'store_manager'], permissions: ['merchandising.products.create'] } },
      { path: 'products/:id/edit', name: 'merchandising.products.edit', component: () => import('../views/system/merchandising/products/ProductForm.vue'), meta: { title: 'Edit Product', subtitle: 'Update product information', roles: ['super_admin', 'store_admin', 'store_manager'], permissions: ['merchandising.products.update'] } },
      { path: 'products/:id', name: 'merchandising.products.view', component: () => import('../views/system/merchandising/products/ProductView.vue'), meta: { title: 'Product Details', subtitle: 'View detailed product information and 3D model', roles: ['super_admin', 'store_admin', 'store_manager', 'warehouse_manager', 'inventory_staff', 'sales_staff', 'supplier_coordinator'], permissions: ['merchandising.products.read'] } },
      { path: 'variations', name: 'merchandising.variations', component: () => import('../views/system/merchandising/variations/VariationsList.vue'), meta: { title: 'Product Variations', subtitle: 'Manage colors, sizes, and materials', roles: ['super_admin', 'store_admin', 'store_manager', 'warehouse_manager', 'sales_staff'], permissions: ['merchandising.variations.view'] } },
      { path: 'variations/new', name: 'merchandising.variations.create', component: () => import('../views/system/merchandising/variations/VariationForm.vue'), meta: { title: 'Add New Variation', subtitle: 'Create a new product variation', roles: ['super_admin', 'store_admin', 'store_manager'], permissions: ['merchandising.variations.create'] } },
      { path: 'variations/:id/edit', name: 'merchandising.variations.edit', component: () => import('../views/system/merchandising/variations/VariationForm.vue'), meta: { title: 'Edit Variation', subtitle: 'Update variation details', roles: ['super_admin', 'store_admin', 'store_manager'], permissions: ['merchandising.variations.update'] } },
      { path: 'assets', name: 'merchandising.assets', component: () => import('../views/system/merchandising/assets/AssetsList.vue'), meta: { title: '3D Models & Assets', subtitle: 'Upload and manage 3D models, images, and videos', roles: ['super_admin', 'store_admin', 'store_manager', 'sales_staff'], permissions: ['merchandising.assets.view'] } },
      { path: 'assets/upload', name: 'merchandising.assets.upload', component: () => import('../views/system/merchandising/assets/AssetUpload.vue'), meta: { title: 'Upload Asset', subtitle: 'Upload new 3D model or image', roles: ['super_admin', 'store_admin', 'store_manager'], permissions: ['merchandising.assets.create'] } },
      { path: 'inventory', name: 'merchandising.inventory', component: () => import('../views/system/merchandising/inventory/InventoryList.vue'), meta: { title: 'Inventory Status', subtitle: 'Monitor stock levels across all products', roles: ['super_admin', 'store_admin', 'store_manager', 'warehouse_manager', 'inventory_staff', 'supplier_coordinator'], permissions: ['merchandising.inventory.view'] } },
      { path: 'categories', name: 'merchandising.categories', component: () => import('../views/system/merchandising/categories/CategoriesList.vue'), meta: { title: 'Product Categories', subtitle: 'Organize your furniture catalog', roles: ['super_admin', 'store_admin', 'store_manager'], permissions: ['merchandising.categories.view'] } },
      { path: 'categories/new', name: 'merchandising.categories.create', component: () => import('../views/system/merchandising/categories/CategoryForm.vue'), meta: { title: 'Add Category', subtitle: 'Create a new product category', roles: ['super_admin', 'store_admin', 'store_manager'], permissions: ['merchandising.categories.create'] } },
      { path: 'categories/:id/edit', name: 'merchandising.categories.edit', component: () => import('../views/system/merchandising/categories/CategoryForm.vue'), meta: { title: 'Edit Category', subtitle: 'Update category information', roles: ['super_admin', 'store_admin', 'store_manager'], permissions: ['merchandising.categories.update'] } },
      { path: 'attributes', name: 'merchandising.attributes', component: () => import('../views/system/merchandising/attributes/AttributesList.vue'), meta: { title: 'Product Attributes', subtitle: 'Define filterable product characteristics', roles: ['super_admin', 'store_admin', 'store_manager'], permissions: ['merchandising.attributes.view'] } },
      { path: 'attributes/new', name: 'merchandising.attributes.create', component: () => import('../views/system/merchandising/attributes/AttributeForm.vue'), meta: { title: 'Add Attribute', subtitle: 'Create a new product attribute', roles: ['super_admin', 'store_admin', 'store_manager'], permissions: ['merchandising.attributes.create'] } },
      { path: 'tags', name: 'merchandising.tags', component: () => import('../views/system/merchandising/tags/TagsList.vue'), meta: { title: 'Tags & Collections', subtitle: 'Manage product tags and collections', roles: ['super_admin', 'store_admin', 'store_manager'], permissions: ['merchandising.tags.view'] } },
      { path: 'pricing', name: 'merchandising.pricing', component: () => import('../views/system/merchandising/pricing/PricingRules.vue'), meta: { title: 'Pricing Rules', subtitle: 'Set discounts and pricing strategies', roles: ['super_admin', 'store_admin', 'store_manager'], permissions: ['merchandising.pricing.view'] } },
      { path: 'pricing/bulk-update', name: 'merchandising.pricing.bulk', component: () => import('../views/system/merchandising/pricing/BulkPricing.vue'), meta: { title: 'Bulk Price Update', subtitle: 'Update multiple product prices at once', roles: ['super_admin', 'store_admin', 'store_manager'], permissions: ['merchandising.pricing.update'] } },
      { path: 'reports', name: 'merchandising.reports', component: () => import('../views/system/merchandising/reports/SalesReports.vue'), meta: { title: 'Sales Reports', subtitle: 'Analyze product performance', roles: ['super_admin', 'store_admin', 'store_manager'], permissions: ['merchandising.reports.view'] } },
      { path: 'pricing-history', name: 'merchandising.pricing-history', component: () => import('../views/system/merchandising/reports/PricingHistory.vue'), meta: { title: 'Pricing History', subtitle: 'Track price changes over time', roles: ['super_admin', 'store_admin', 'store_manager'], permissions: ['merchandising.reports.view'] } },
      { path: '', redirect: { name: 'merchandising.products' } }
    ]
  },
  {
    path: '/inventory',
    component: InventoryLayout,
    children: []
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: Unauthorized,
    meta: { requiresAuth: false }
  },
  // {
  //   path: '/reset',
  //   name: 'Reset',
  //   component: () => import('../views/auth/Reset.vue')
  // },
  { path: '/dashboard', redirect: '/system' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  console.log('🔍 Router guard:', {
    to: to.path,
    from: from.path,
    isAuthenticated,
    permissionsLoaded: authStore.permissionsLoaded,
    isLoadingPermissions: authStore.isLoadingPermissions
  })

  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('❌ Not authenticated')
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  if (isAuthenticated && !authStore.permissionsLoaded && !authStore.isLoadingPermissions) {
    console.log('📥 Router guard loading permissions...')
    await authStore.loadPermissions()
  } else if (authStore.isLoadingPermissions) {
    console.log('⏸️ Router guard waiting for permissions to load...')
    while (authStore.isLoadingPermissions) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }

  if (to.meta.permission) {
    const hasPermission = authStore.hasPermission(to.meta.permission as string)

    if (!hasPermission) {
      console.log('❌ Access denied:', to.meta.permission)
      return next({ name: 'Unauthorized' })
    }
  }

  if (to.meta.requiresGuest && isAuthenticated) {
    console.log('ℹ️ Redirecting authenticated user')
    return next(authStore.defaultRoute)
  }

  console.log('✅ Navigation allowed')
  next()
})

export default router