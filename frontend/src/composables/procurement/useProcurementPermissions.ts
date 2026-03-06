// frontend/src/composables/procurement/useProcurementPermissions.ts
import { computed } from 'vue';
import { useAuthStore } from '../../stores/auth';

export function useProcurementPermissions() {
  const authStore = useAuthStore();

  // Helper function to check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    return authStore.hasPermission(permission);
  };

  // Supplier Permissions
  const canViewSuppliers = computed(() => hasPermission('view_suppliers'));
  const canCreateSuppliers = computed(() => hasPermission('create_suppliers'));
  const canEditSuppliers = computed(() => hasPermission('edit_suppliers'));
  const canDeleteSuppliers = computed(() => hasPermission('delete_suppliers'));

  // Purchase Requisition Permissions
  const canViewRequisitions = computed(() => hasPermission('view_purchase_requisitions'));
  const canCreateRequisitions = computed(() => hasPermission('create_purchase_requisitions'));
  const canEditRequisitions = computed(() => hasPermission('edit_purchase_requisitions'));
  const canSubmitRequisitions = computed(() => hasPermission('submit_purchase_requisitions'));
  const canApproveRequisitions = computed(() => hasPermission('approve_purchase_requisitions'));
  const canRejectRequisitions = computed(() => hasPermission('reject_purchase_requisitions'));

  // RFQ Permissions
  const canViewRFQs = computed(() => hasPermission('view_rfqs'));
  const canCreateRFQs = computed(() => hasPermission('create_rfqs'));
  const canEditRFQs = computed(() => hasPermission('edit_rfqs'));
  const canSendRFQs = computed(() => hasPermission('send_rfqs'));
  const canCloseRFQs = computed(() => hasPermission('close_rfqs'));
  const canAwardRFQs = computed(() => hasPermission('award_rfqs'));

  // Quotation Permissions
  const canViewQuotations = computed(() => hasPermission('view_quotations'));
  const canCreateQuotations = computed(() => hasPermission('create_quotations'));
  const canEditQuotations = computed(() => hasPermission('edit_quotations'));
  const canEvaluateQuotations = computed(() => hasPermission('evaluate_quotations'));
  const canAcceptQuotations = computed(() => hasPermission('accept_quotations'));
  const canRejectQuotations = computed(() => hasPermission('reject_quotations'));

  // Purchase Order Permissions
  const canViewPOs = computed(() => hasPermission('view_purchase_orders'));
  const canCreatePOs = computed(() => hasPermission('create_purchase_orders'));
  const canEditPOs = computed(() => hasPermission('edit_purchase_orders'));
  const canApprovePOs = computed(() => hasPermission('approve_purchase_orders'));
  const canRejectPOs = computed(() => hasPermission('reject_purchase_orders'));
  const canSendPOs = computed(() => hasPermission('send_purchase_orders'));
  const canCancelPOs = computed(() => hasPermission('cancel_purchase_orders'));
  const canPrintPOs = computed(() => hasPermission('print_purchase_orders'));

  // Goods Receipt Permissions
  const canViewReceipts = computed(() => hasPermission('view_goods_receipts'));
  const canCreateReceipts = computed(() => hasPermission('create_goods_receipts'));
  const canEditReceipts = computed(() => hasPermission('edit_goods_receipts'));
  const canVerifyReceipts = computed(() => hasPermission('verify_goods_receipts'));

  // Payment Permissions
  const canViewPayments = computed(() => hasPermission('view_supplier_payments'));
  const canCreatePayments = computed(() => hasPermission('create_supplier_payments'));
  const canEditPayments = computed(() => hasPermission('edit_supplier_payments'));
  const canApprovePayments = computed(() => hasPermission('approve_supplier_payments'));
  const canRejectPayments = computed(() => hasPermission('reject_supplier_payments'));
  const canProcessPayments = computed(() => hasPermission('process_supplier_payments'));

  // Dashboard Permissions
  const canViewDashboard = computed(() => hasPermission('view_procurement_dashboard'));

  // Combined permissions for common checks
  const canManageSuppliers = computed(() => 
    canCreateSuppliers.value || canEditSuppliers.value || canDeleteSuppliers.value
  );

  const canManageRequisitions = computed(() =>
    canCreateRequisitions.value || canEditRequisitions.value || canApproveRequisitions.value
  );

  const canManageRFQs = computed(() =>
    canCreateRFQs.value || canEditRFQs.value || canSendRFQs.value || canAwardRFQs.value
  );

  const canManagePOs = computed(() =>
    canCreatePOs.value || canEditPOs.value || canApprovePOs.value
  );

  const canManagePayments = computed(() =>
    canCreatePayments.value || canApprovePayments.value || canProcessPayments.value
  );

  return {
    // Supplier permissions
    canViewSuppliers,
    canCreateSuppliers,
    canEditSuppliers,
    canDeleteSuppliers,
    canManageSuppliers,

    // Purchase Requisition permissions
    canViewRequisitions,
    canCreateRequisitions,
    canEditRequisitions,
    canSubmitRequisitions,
    canApproveRequisitions,
    canRejectRequisitions,
    canManageRequisitions,

    // RFQ permissions
    canViewRFQs,
    canCreateRFQs,
    canEditRFQs,
    canSendRFQs,
    canCloseRFQs,
    canAwardRFQs,
    canManageRFQs,

    // Quotation permissions
    canViewQuotations,
    canCreateQuotations,
    canEditQuotations,
    canEvaluateQuotations,
    canAcceptQuotations,
    canRejectQuotations,

    // Purchase Order permissions
    canViewPOs,
    canCreatePOs,
    canEditPOs,
    canApprovePOs,
    canRejectPOs,
    canSendPOs,
    canCancelPOs,
    canPrintPOs,
    canManagePOs,

    // Goods Receipt permissions
    canViewReceipts,
    canCreateReceipts,
    canEditReceipts,
    canVerifyReceipts,

    // Payment permissions
    canViewPayments,
    canCreatePayments,
    canEditPayments,
    canApprovePayments,
    canRejectPayments,
    canProcessPayments,
    canManagePayments,

    // Dashboard permissions
    canViewDashboard,
  };
}
