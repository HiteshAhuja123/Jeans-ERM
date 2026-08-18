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

export type MasterStatus = "active" | "inactive";

export type CustomerType = "brand" | "retailer" | "wholesaler" | "individual";

export interface Customer {
  id: string;
  code: string;
  name: string;
  type: CustomerType;
  /** Derived "City, Country" display string, kept for Phase 1/2 screens. */
  location: string;
  address?: string;
  city: string;
  country: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: MasterStatus;
  notes?: string;
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

export type SupplierType =
  | "fabric"
  | "accessories"
  | "packaging"
  | "washing_vendor"
  | "processing_vendor"
  | "other";

export interface Supplier {
  id: string;
  code: string;
  name: string;
  type: SupplierType;
  /** Coarse category, kept for existing Purchasing/Inventory consumers. */
  category: MaterialCategory;
  location: string;
  address?: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: MasterStatus;
  notes?: string;
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

// ---------------------------------------------------------------------------
// Master Data (Phase 3)
// ---------------------------------------------------------------------------

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  status: MasterStatus;
}

export type Gender = "men" | "women" | "unisex" | "kids";

export interface Style {
  id: string;
  styleCode: string;
  name: string;
  productId: string;
  category: string;
  gender: Gender;
  fit: string;
  fabricType: string;
  /** Process ids, in suggested order — not an enforced workflow. */
  defaultOperationIds: string[];
  status: MasterStatus;
}

export interface Sku {
  id: string;
  skuCode: string;
  styleId: string;
  colorId: string;
  sizeId: string;
  status: MasterStatus;
}

export interface Size {
  id: string;
  code: string;
  displayName: string;
  sequence: number;
  status: MasterStatus;
}

export interface Color {
  id: string;
  code: string;
  name: string;
  hex: string;
  status: MasterStatus;
}

export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  status: MasterStatus;
}

/** Configurable, fine-grained grouping of materials (Denim, Zippers, Thread, Packaging, …). */
export interface MaterialGroup {
  id: string;
  code: string;
  name: string;
  parentCategory: MaterialCategory;
  status: MasterStatus;
}

export interface FabricDetails {
  composition: string;
  weightGsm?: number;
  weightOz?: number;
  widthCm: number;
  stretch: boolean;
}

export interface Material {
  id: string;
  code: string;
  name: string;
  materialGroupId: string;
  uomId: string;
  supplierId?: string;
  colorId?: string;
  description?: string;
  /** Present only for materials whose group's parentCategory is "fabric". */
  fabricDetails?: FabricDetails;
  status: MasterStatus;
}

export type WarehouseType = "raw_material" | "finished_goods" | "general";

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: WarehouseType;
  address?: string;
  status: MasterStatus;
}

export interface StorageLocation {
  id: string;
  code: string;
  name: string;
  warehouseId: string;
  status: MasterStatus;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: MasterStatus;
}

/** Master-data production line record — distinct from the dashboard's ProductionLineSummary. */
export interface ProductionLine {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  capacity: number;
  supervisor: string;
  status: MasterStatus;
}

export type MachineStatus = "available" | "running" | "maintenance" | "inactive";

export interface Machine {
  id: string;
  code: string;
  name: string;
  machineType: string;
  departmentId: string;
  productionLineId?: string;
  status: MachineStatus;
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  designation: string;
  phone: string;
  email?: string;
  status: MasterStatus;
}

export interface Process {
  id: string;
  code: string;
  name: string;
  sequence: number;
  departmentId?: string;
  status: MasterStatus;
}
