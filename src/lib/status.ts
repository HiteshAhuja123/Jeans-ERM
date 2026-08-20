import type {
  AlertLevel,
  BundleStatus,
  CuttingBatchStatus,
  CuttingOrderStatus,
  CuttingPlanStatus,
  DefectSeverity,
  DispatchStatus,
  FabricAllocationStatus,
  MachineStatus,
  MasterStatus,
  OrderPriority,
  OrderStatus,
  ProductionOrderStatus,
  ProductionPlanStatus,
  ProductionStageStatus,
  PurchaseOrderStatus,
  PurchaseRequestPriority,
  PurchaseRequestStatus,
  ReceivingItemStatus,
  SewingOrderStatus,
  SewingReworkStatus,
  StatusLevel,
  StatusMeta,
  StockLevel,
  StockMovementType,
} from "@/types";

export const orderStatusMeta: Record<OrderStatus, StatusMeta> = {
  draft: { label: "Draft", level: "neutral" },
  confirmed: { label: "Confirmed", level: "info" },
  in_production: { label: "In Production", level: "info" },
  partially_completed: { label: "Partially Completed", level: "warning" },
  completed: { label: "Completed", level: "success" },
  dispatched: { label: "Dispatched", level: "success" },
  cancelled: { label: "Cancelled", level: "neutral" },
};

export const orderPriorityMeta: Record<OrderPriority, StatusMeta> = {
  low: { label: "Low", level: "neutral" },
  normal: { label: "Normal", level: "info" },
  high: { label: "High", level: "warning" },
  urgent: { label: "Urgent", level: "critical" },
};

export const productionPlanStatusMeta: Record<ProductionPlanStatus, StatusMeta> = {
  draft: { label: "Draft", level: "neutral" },
  under_review: { label: "Under Review", level: "warning" },
  approved: { label: "Approved", level: "info" },
  in_progress: { label: "In Progress", level: "info" },
  completed: { label: "Completed", level: "success" },
  cancelled: { label: "Cancelled", level: "neutral" },
};

export const productionOrderStatusMeta: Record<ProductionOrderStatus, StatusMeta> = {
  draft: { label: "Draft", level: "neutral" },
  planned: { label: "Planned", level: "info" },
  released: { label: "Released", level: "info" },
  in_progress: { label: "In Progress", level: "info" },
  on_hold: { label: "On Hold", level: "warning" },
  partially_completed: { label: "Partially Completed", level: "warning" },
  completed: { label: "Completed", level: "success" },
  cancelled: { label: "Cancelled", level: "neutral" },
};

export const stockLevelMeta: Record<StockLevel, StatusMeta> = {
  healthy: { label: "Healthy", level: "success" },
  low: { label: "Low Stock", level: "warning" },
  critical: { label: "Critical", level: "critical" },
  out_of_stock: { label: "Out of Stock", level: "critical" },
};

export const productionStageStatusMeta: Record<ProductionStageStatus, StatusMeta> = {
  done: { label: "Done", level: "success" },
  in_progress: { label: "In Progress", level: "info" },
  pending: { label: "Pending", level: "neutral" },
  blocked: { label: "Blocked", level: "critical" },
};

export const purchaseOrderStatusMeta: Record<PurchaseOrderStatus, StatusMeta> = {
  draft: { label: "Draft", level: "neutral" },
  pending_approval: { label: "Pending Approval", level: "warning" },
  approved: { label: "Approved", level: "info" },
  sent: { label: "Sent", level: "info" },
  partially_received: { label: "Partially Received", level: "warning" },
  received: { label: "Received", level: "success" },
  cancelled: { label: "Cancelled", level: "neutral" },
};

export const purchaseRequestStatusMeta: Record<PurchaseRequestStatus, StatusMeta> = {
  draft: { label: "Draft", level: "neutral" },
  submitted: { label: "Submitted", level: "info" },
  pending_approval: { label: "Pending Approval", level: "warning" },
  approved: { label: "Approved", level: "success" },
  rejected: { label: "Rejected", level: "critical" },
  converted: { label: "Converted to PO", level: "info" },
  cancelled: { label: "Cancelled", level: "neutral" },
};

export const purchaseRequestPriorityMeta: Record<PurchaseRequestPriority, StatusMeta> = {
  low: { label: "Low", level: "neutral" },
  normal: { label: "Normal", level: "info" },
  high: { label: "High", level: "warning" },
  urgent: { label: "Urgent", level: "critical" },
};

export const stockMovementTypeMeta: Record<StockMovementType, StatusMeta> = {
  receipt: { label: "Receipt", level: "success" },
  issue: { label: "Issue", level: "info" },
  transfer: { label: "Transfer", level: "info" },
  adjustment: { label: "Adjustment", level: "warning" },
  return: { label: "Return", level: "info" },
  damage: { label: "Damage", level: "critical" },
  rejection: { label: "Rejection", level: "critical" },
};

export const receivingItemStatusMeta: Record<ReceivingItemStatus, StatusMeta> = {
  pending_inspection: { label: "Pending Inspection", level: "warning" },
  accepted: { label: "Accepted", level: "success" },
  rejected: { label: "Rejected", level: "critical" },
  partially_accepted: { label: "Partially Accepted", level: "warning" },
};

export const defectSeverityMeta: Record<DefectSeverity, StatusMeta> = {
  minor: { label: "Minor", level: "warning" },
  major: { label: "Major", level: "critical" },
  critical: { label: "Critical", level: "critical" },
};

export const dispatchStatusMeta: Record<DispatchStatus, StatusMeta> = {
  pending: { label: "Pending", level: "neutral" },
  packed: { label: "Packed", level: "info" },
  in_transit: { label: "In Transit", level: "warning" },
  delivered: { label: "Delivered", level: "success" },
};

export const alertLevelMeta: Record<AlertLevel, StatusMeta> = {
  info: { label: "Info", level: "info" },
  warning: { label: "Warning", level: "warning" },
  critical: { label: "Critical", level: "critical" },
};

export const activeStatusMeta: Record<MasterStatus, StatusMeta> = {
  active: { label: "Active", level: "success" },
  inactive: { label: "Inactive", level: "neutral" },
};

export const machineStatusMeta: Record<MachineStatus, StatusMeta> = {
  available: { label: "Available", level: "success" },
  running: { label: "Running", level: "info" },
  maintenance: { label: "Maintenance", level: "warning" },
  inactive: { label: "Inactive", level: "neutral" },
};

export const cuttingOrderStatusMeta: Record<CuttingOrderStatus, StatusMeta> = {
  pending: { label: "Pending", level: "neutral" },
  material_check: { label: "Material Check", level: "warning" },
  ready: { label: "Ready", level: "info" },
  in_progress: { label: "In Progress", level: "info" },
  partially_completed: { label: "Partially Completed", level: "warning" },
  completed: { label: "Completed", level: "success" },
  on_hold: { label: "On Hold", level: "warning" },
  cancelled: { label: "Cancelled", level: "neutral" },
};

export const fabricAllocationStatusMeta: Record<FabricAllocationStatus, StatusMeta> = {
  allocated: { label: "Allocated", level: "info" },
  partially_issued: { label: "Partially Issued", level: "warning" },
  issued: { label: "Issued", level: "success" },
  cancelled: { label: "Cancelled", level: "neutral" },
};

export const cuttingPlanStatusMeta: Record<CuttingPlanStatus, StatusMeta> = {
  draft: { label: "Draft", level: "neutral" },
  approved: { label: "Approved", level: "info" },
  in_progress: { label: "In Progress", level: "info" },
  completed: { label: "Completed", level: "success" },
  cancelled: { label: "Cancelled", level: "neutral" },
};

export const cuttingBatchStatusMeta: Record<CuttingBatchStatus, StatusMeta> = {
  pending: { label: "Pending", level: "neutral" },
  in_progress: { label: "In Progress", level: "info" },
  on_hold: { label: "On Hold", level: "warning" },
  completed: { label: "Completed", level: "success" },
  cancelled: { label: "Cancelled", level: "neutral" },
};

export const bundleStatusMeta: Record<BundleStatus, StatusMeta> = {
  created: { label: "Created", level: "neutral" },
  pending_verification: { label: "Pending Verification", level: "warning" },
  ready_for_sewing: { label: "Ready for Sewing", level: "success" },
  assigned: { label: "Assigned", level: "info" },
  issued_to_sewing: { label: "Issued to Sewing", level: "info" },
  in_sewing: { label: "In Sewing", level: "info" },
  partially_completed: { label: "Partially Completed", level: "warning" },
  completed: { label: "Completed", level: "success" },
  on_hold: { label: "On Hold", level: "warning" },
  cancelled: { label: "Cancelled", level: "neutral" },
};

export const sewingOrderStatusMeta: Record<SewingOrderStatus, StatusMeta> = {
  planned: { label: "Planned", level: "neutral" },
  assigned: { label: "Assigned", level: "info" },
  ready: { label: "Ready", level: "info" },
  in_progress: { label: "In Progress", level: "info" },
  partially_completed: { label: "Partially Completed", level: "warning" },
  on_hold: { label: "On Hold", level: "warning" },
  processing_complete: { label: "Processing Complete", level: "warning" },
  completed: { label: "Completed", level: "success" },
  cancelled: { label: "Cancelled", level: "neutral" },
};

export const sewingReworkStatusMeta: Record<SewingReworkStatus, StatusMeta> = {
  pending: { label: "Pending", level: "warning" },
  in_progress: { label: "In Progress", level: "info" },
  completed: { label: "Completed", level: "success" },
  rejected: { label: "Rejected", level: "critical" },
};

export const statusLevelClasses: Record<StatusLevel, string> = {
  success: "bg-success-subtle text-success border-success/20",
  warning: "bg-warning-subtle text-warning border-warning/25",
  critical: "bg-critical-subtle text-critical border-critical/20",
  info: "bg-info-subtle text-info border-info/20",
  neutral: "bg-muted text-muted-foreground border-border",
};

export const statusLevelDotClasses: Record<StatusLevel, string> = {
  success: "bg-success",
  warning: "bg-warning",
  critical: "bg-critical",
  info: "bg-info",
  neutral: "bg-muted-foreground",
};
