/**
 * Core domain types for the ERM Jeans factory management system.
 * Phase 1 scope: shapes are wide enough to power realistic mock UI,
 * not yet a finalized backend schema.
 */

export type Role =
  | "owner"
  | "management"
  | "production_manager"
  | "production_supervisor"
  | "store_manager"
  | "purchase_manager"
  | "qc_manager"
  | "qc_staff"
  | "cutting_staff"
  | "sewing_staff"
  | "packing_staff"
  | "dispatch_staff"
  | "admin_staff";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  initials: string;
}

/** A generic status level used to drive color + icon across the app. */
export type StatusLevel = "success" | "warning" | "critical" | "info" | "neutral";

export interface StatusMeta {
  label: string;
  level: StatusLevel;
}

// ---------------------------------------------------------------------------
// Customers & Orders
// ---------------------------------------------------------------------------

export interface Customer {
  id: string;
  name: string;
  location: string;
  contactPerson: string;
  email: string;
  phone: string;
  activeOrders: number;
  totalOrders: number;
}

export type OrderStatus =
  | "draft"
  | "confirmed"
  | "in_production"
  | "delayed"
  | "completed"
  | "dispatched"
  | "cancelled";

export interface OrderLineItem {
  id: string;
  styleCode: string;
  styleName: string;
  color: string;
  sizeBreakdown: Record<string, number>;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  styleCode: string;
  styleName: string;
  fabric: string;
  quantity: number;
  quantityProduced: number;
  status: OrderStatus;
  orderDate: string;
  dueDate: string;
  isDelayed: boolean;
  currentStage: ProductionStageKey;
  priority: "low" | "normal" | "high";
}

// ---------------------------------------------------------------------------
// Production
// ---------------------------------------------------------------------------

export type ProductionStageKey =
  | "cutting"
  | "sewing"
  | "washing"
  | "finishing"
  | "qc"
  | "packing"
  | "dispatch";

export type ProductionStageStatus = "done" | "in_progress" | "pending" | "blocked";

export interface ProductionStageProgress {
  stage: ProductionStageKey;
  status: ProductionStageStatus;
  completedPieces: number;
  totalPieces: number;
}

export interface ProductionOrderProgress {
  orderId: string;
  orderNumber: string;
  customerName: string;
  styleCode: string;
  totalQuantity: number;
  stages: ProductionStageProgress[];
}

export interface DailyProductionEntry {
  date: string;
  target: number;
  completed: number;
}

export interface ProductionLineSummary {
  id: string;
  name: string;
  stage: ProductionStageKey;
  supervisor: string;
  target: number;
  completed: number;
  activeOrderNumber: string;
}

// ---------------------------------------------------------------------------
// Inventory & Materials
// ---------------------------------------------------------------------------

export type MaterialCategory = "fabric" | "accessory" | "raw_material" | "finished_good";

export type StockLevel = "healthy" | "low" | "critical" | "out_of_stock";

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  quantityInStock: number;
  reorderLevel: number;
  stockLevel: StockLevel;
  warehouseLocation: string;
  lastMovementDate: string;
  unitCost: number;
}

export type StockMovementType = "receipt" | "issue" | "adjustment" | "transfer";

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: StockMovementType;
  quantity: number;
  unit: string;
  reference: string;
  date: string;
  performedBy: string;
}

// ---------------------------------------------------------------------------
// Purchasing
// ---------------------------------------------------------------------------

export interface Supplier {
  id: string;
  name: string;
  category: MaterialCategory;
  location: string;
  rating: number;
  activeOrders: number;
  onTimeDeliveryRate: number;
}

export type PurchaseOrderStatus = "draft" | "sent" | "partially_received" | "received" | "cancelled";

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  itemSummary: string;
  totalValue: number;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate: string;
}

export type PurchaseRequestStatus = "pending_approval" | "approved" | "rejected" | "converted";

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  requestedBy: string;
  itemSummary: string;
  quantity: number;
  unit: string;
  neededBy: string;
  status: PurchaseRequestStatus;
  urgency: "low" | "normal" | "high";
}

// ---------------------------------------------------------------------------
// Quality Control
// ---------------------------------------------------------------------------

export type DefectSeverity = "minor" | "major" | "critical";

export interface QcInspection {
  id: string;
  orderNumber: string;
  styleCode: string;
  stage: ProductionStageKey;
  inspectedQty: number;
  passedQty: number;
  failedQty: number;
  passRate: number;
  inspector: string;
  date: string;
}

export interface DefectRecord {
  id: string;
  orderNumber: string;
  defectType: string;
  severity: DefectSeverity;
  quantity: number;
  stage: ProductionStageKey;
  status: "open" | "in_rework" | "resolved" | "rejected";
  reportedDate: string;
}

// ---------------------------------------------------------------------------
// Packing & Dispatch
// ---------------------------------------------------------------------------

export type DispatchStatus = "pending" | "packed" | "in_transit" | "delivered";

export interface DispatchRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  quantity: number;
  cartons: number;
  status: DispatchStatus;
  dispatchDate: string;
  carrier: string;
  trackingRef: string;
}

// ---------------------------------------------------------------------------
// Dashboard / Alerts / Activity
// ---------------------------------------------------------------------------

export type AlertLevel = "info" | "warning" | "critical";

export interface AlertItem {
  id: string;
  level: AlertLevel;
  title: string;
  description: string;
  module: string;
  timestamp: string;
  href?: string;
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface ApprovalItem {
  id: string;
  type: string;
  title: string;
  requestedBy: string;
  amount?: number;
  timestamp: string;
}
