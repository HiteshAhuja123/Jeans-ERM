import type {
  AlertLevel,
  DefectSeverity,
  DispatchStatus,
  MachineStatus,
  MasterStatus,
  OrderPriority,
  OrderStatus,
  ProductionStageStatus,
  PurchaseOrderStatus,
  PurchaseRequestStatus,
  StatusLevel,
  StatusMeta,
  StockLevel,
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
  sent: { label: "Sent", level: "info" },
  partially_received: { label: "Partially Received", level: "warning" },
  received: { label: "Received", level: "success" },
  cancelled: { label: "Cancelled", level: "neutral" },
};

export const purchaseRequestStatusMeta: Record<PurchaseRequestStatus, StatusMeta> = {
  pending_approval: { label: "Pending Approval", level: "warning" },
  approved: { label: "Approved", level: "success" },
  rejected: { label: "Rejected", level: "critical" },
  converted: { label: "Converted to PO", level: "info" },
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
