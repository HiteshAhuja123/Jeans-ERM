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

/**
 * Order lifecycle only — NOT production status. A "confirmed" order can be
 * behind schedule (see `isDelayed`) without that changing its order status.
 */
export type OrderStatus =
  | "draft"
  | "confirmed"
  | "in_production"
  | "partially_completed"
  | "completed"
  | "dispatched"
  | "cancelled";

export type OrderPriority = "low" | "normal" | "high" | "urgent";

export interface OrderItemSizeQty {
  sizeId: string;
  quantity: number;
}

export interface OrderLineItem {
  id: string;
  styleId: string;
  styleCode: string;
  styleName: string;
  colorId: string;
  colorName: string;
  /** Set when the style/color/size combination matches a real SKU master record. */
  skuId?: string;
  sizeBreakdown: OrderItemSizeQty[];
  /** Sum of `sizeBreakdown` quantities, kept denormalized for display. */
  quantity: number;
  unit: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  /** Denormalized for display; source of truth is the Customer record. */
  customerName: string;
  /** Buyer's own PO/reference number, if any. */
  customerReference?: string;
  orderDate: string;
  /** Required/expected delivery date. */
  dueDate: string;
  priority: OrderPriority;
  status: OrderStatus;
  lineItems: OrderLineItem[];
  /** Sum of all line item quantities. */
  quantity: number;
  /** Mock/visualization aggregate — not driven by real production transactions until a later phase. */
  quantityProduced: number;
  /** Visualization only — the production module owns real stage tracking in a later phase. */
  currentStage: ProductionStageKey;
  /** True when the order is behind schedule — an alert flag, not a status. */
  isDelayed: boolean;
  deliveryLocation?: string;
  shippingInstructions?: string;
  /** Customer-visible notes. */
  notes?: string;
  /** Internal-only notes — never exposed in future customer-facing integrations. */
  internalNotes?: string;
}

export interface OrderActivityEntry {
  id: string;
  orderId: string;
  actor: string;
  action: string;
  timestamp: string;
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
// Production Planning (Phase 6)
// ---------------------------------------------------------------------------

export type ProductionPlanStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "in_progress"
  | "completed"
  | "cancelled";

/** A planning period grouping one or more Production Orders — not itself a manufacturing instruction. */
export interface ProductionPlan {
  id: string;
  planNumber: string;
  periodStart: string;
  periodEnd: string;
  planner: string;
  status: ProductionPlanStatus;
  notes?: string;
  createdDate: string;
}

export type ProductionOrderStatus =
  | "draft"
  | "planned"
  | "released"
  | "in_progress"
  | "on_hold"
  | "partially_completed"
  | "completed"
  | "cancelled";

/**
 * "What the factory has decided to manufacture" — distinct from a customer Order
 * ("what the customer wants"). Always traces back to one Order line item; multiple
 * Production Orders may split a single line item's quantity across batches/lines
 * (partial production / splitting are the same mechanism here).
 */
export interface ProductionOrder {
  id: string;
  productionOrderNumber: string;
  planId?: string;
  orderId: string;
  orderNumber: string;
  orderLineItemId: string;
  customerId: string;
  customerName: string;
  styleId: string;
  styleCode: string;
  styleName: string;
  colorId: string;
  colorName: string;
  quantity: number;
  unit: string;
  priority: OrderPriority;
  plannedStart: string;
  plannedEnd: string;
  productionLineId?: string;
  supervisor?: string;
  status: ProductionOrderStatus;
  /** Visualization only — Phase 7+ populates real execution data. */
  currentStage: ProductionStageKey;
  quantityProduced: number;
  notes?: string;
}

export interface BomItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  /** Base quantity consumed per finished piece, before wastage. */
  quantityPerPiece: number;
  unit: string;
  /** Configurable wastage allowance as a percentage, e.g. 5 = 5%. */
  wastagePercent: number;
}

/** One Bill of Materials per Style — the foundational, non-versioned BOM concept for Phase 6. */
export interface Bom {
  id: string;
  styleId: string;
  styleCode: string;
  status: MasterStatus;
  items: BomItem[];
}

/** A soft hold against InventoryBalance.reserved, created when a Production Order is released. */
export interface MaterialReservation {
  id: string;
  productionOrderId: string;
  materialId: string;
  quantity: number;
  createdDate: string;
}

export interface ProductionActivityEntry {
  id: string;
  productionOrderId: string;
  actor: string;
  action: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Inventory & Materials
// ---------------------------------------------------------------------------

export type MaterialCategory = "fabric" | "accessory" | "raw_material" | "finished_good";

/** Derived from Available vs. Reorder Point — never stored, always computed. See `lib/inventory-utils.ts`. */
export type StockLevel = "healthy" | "low" | "critical" | "out_of_stock";

export interface InventoryLocationStock {
  warehouseId: string;
  locationId: string;
  quantity: number;
}

/**
 * A material's current stock position — one record per Material, referenced by id
 * rather than duplicating Material fields. `onHand`/`reserved`/`onOrder` are the only
 * stored quantities; `available` and `stockLevel` are always derived (see inventory-utils).
 */
export interface InventoryBalance {
  /** Same value as `materialId` — one balance per material. */
  id: string;
  materialId: string;
  /** Physically present, usable stock. Excludes rejected/quarantined material by construction. */
  onHand: number;
  /** Held back for confirmed needs (e.g. production allocation) — set by mock data in this phase, not interactively adjustable yet. */
  reserved: number;
  /** Received but rejected on inspection — tracked for visibility, never added to `onHand`. */
  rejected: number;
  reorderPoint: number;
  minimumStock: number;
  locations: InventoryLocationStock[];
  lastMovementDate: string;
  /** Estimated unit cost for operational stock valuation — not an accounting valuation method. */
  unitCost: number;
}

export type StockMovementType =
  | "receipt"
  | "issue"
  | "transfer"
  | "adjustment"
  | "return"
  | "damage"
  | "rejection";

export interface StockMovement {
  id: string;
  materialId: string;
  materialName: string;
  type: StockMovementType;
  /** Signed delta — positive increases on-hand stock, negative decreases it. */
  quantity: number;
  unit: string;
  fromWarehouseId?: string;
  fromLocationId?: string;
  toWarehouseId?: string;
  toLocationId?: string;
  /** e.g. a GRN number, PO number or adjustment reference. */
  reference?: string;
  reason?: string;
  performedBy: string;
  timestamp: string;
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

export type PurchaseOrderStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "partially_received"
  | "received"
  | "cancelled";

export interface PurchaseOrderItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  /** Sum of accepted quantities across all Goods Receipts against this line — derived, never user-edited. */
  receivedQuantity: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDate: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalValue: number;
  notes?: string;
}

export type PurchaseRequestStatus =
  | "draft"
  | "submitted"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "converted"
  | "cancelled";

export type PurchaseRequestPriority = "low" | "normal" | "high" | "urgent";

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  requestedBy: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  requiredDate: string;
  requestDate: string;
  preferredSupplierId?: string;
  priority: PurchaseRequestPriority;
  reason: string;
  notes?: string;
  /** Optional link to the customer Order that drove this requirement. */
  referenceOrderId?: string;
  status: PurchaseRequestStatus;
  /** Set once this request has been converted to a Purchase Order. */
  convertedToPoId?: string;
}

export type ReceivingItemStatus = "pending_inspection" | "accepted" | "rejected" | "partially_accepted";

export interface GoodsReceiptItem {
  id: string;
  poItemId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  unit: string;
  inspectionStatus: ReceivingItemStatus;
  warehouseId: string;
  locationId: string;
}

export interface GoodsReceipt {
  id: string;
  grnNumber: string;
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  receivedDate: string;
  items: GoodsReceiptItem[];
  receivedBy: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Cutting & Bundling (Phase 7)
// ---------------------------------------------------------------------------

export type CuttingOrderStatus =
  | "pending"
  | "material_check"
  | "ready"
  | "in_progress"
  | "partially_completed"
  | "completed"
  | "on_hold"
  | "cancelled";

/**
 * "What needs to be cut" for one Production Order — always traces back to exactly one
 * Production Order. A Production Order never has more than one Cutting Order; cutting in
 * stages is modelled through multiple Cutting Batches under the order's Cutting Plan instead.
 */
export interface CuttingOrder {
  id: string;
  cuttingOrderNumber: string;
  productionOrderId: string;
  productionOrderNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  styleId: string;
  styleCode: string;
  styleName: string;
  colorId: string;
  colorName: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  unit: string;
  /** Pieces the factory intends to cut — normally equal to the Production Order quantity. */
  requiredQuantity: number;
  /** Fabric quantity required to cut `requiredQuantity`, inflated by the style BOM's wastage %. */
  fabricRequired: number;
  priority: OrderPriority;
  status: CuttingOrderStatus;
  supervisor?: string;
  machineId?: string;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  holdReason?: string;
  createdDate: string;
  notes?: string;
}

export type FabricAllocationStatus = "allocated" | "partially_issued" | "issued" | "cancelled";

/** A soft hold of warehouse fabric against one Cutting Order — precedes the physical Fabric Issue. */
export interface FabricAllocation {
  id: string;
  allocationNumber: string;
  productionOrderId: string;
  cuttingOrderId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  warehouseId: string;
  locationId: string;
  date: string;
  status: FabricAllocationStatus;
}

/** One physical hand-off of fabric to the cutting floor. A Cutting Order may have several — partial issues are normal. */
export interface FabricIssue {
  id: string;
  cuttingOrderId: string;
  fabricAllocationId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  warehouseId: string;
  locationId: string;
  issuedBy: string;
  issuedDate: string;
  /** The StockMovement this issue created — traceability into Phase 5 Inventory. */
  movementId: string;
}

export type CuttingPlanStatus = "draft" | "approved" | "in_progress" | "completed" | "cancelled";

/** The cutting instruction for one Cutting Order — realized across one or more Cutting Batches. */
export interface CuttingPlan {
  id: string;
  planNumber: string;
  cuttingOrderId: string;
  productionOrderId: string;
  styleId: string;
  styleCode: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  plannedQuantity: number;
  plannedFabric: number;
  unit: string;
  plannedWastagePercent: number;
  status: CuttingPlanStatus;
  createdDate: string;
  notes?: string;
}

export type CuttingBatchStatus = "pending" | "in_progress" | "on_hold" | "completed" | "cancelled";

/**
 * One cutting run within a Cutting Plan. Never assume one Production Order equals one Cutting
 * Batch — factories routinely split cutting into several batches (by lay, by size run, etc.).
 */
export interface CuttingBatch {
  id: string;
  batchNumber: string;
  cuttingPlanId: string;
  cuttingOrderId: string;
  productionOrderId: string;
  styleId: string;
  styleCode: string;
  colorId: string;
  colorName: string;
  plannedQuantity: number;
  operator?: string;
  supervisor?: string;
  machineId?: string;
  plannedStart?: string;
  actualStart?: string;
  plannedEnd?: string;
  actualEnd?: string;
  status: CuttingBatchStatus;
  holdReason?: string;
  createdDate: string;
}

/** One "record output" event against a Cutting Batch. Batch totals are always the sum of its entries — never edited directly. */
export interface CuttingOutput {
  id: string;
  cuttingBatchId: string;
  cuttingOrderId: string;
  /** Total pieces cut in this entry — good + rejected. */
  cutQuantity: number;
  rejectedQuantity: number;
  /** Fabric consumed to produce this entry's cut quantity. */
  fabricUsed: number;
  unit: string;
  /** Good-piece breakdown by size for this entry — preserves size/color traceability into Bundling. */
  sizeBreakdown: OrderItemSizeQty[];
  wastageReasonId?: string;
  notes?: string;
  recordedBy: string;
  recordedDate: string;
}

/** Reason-level breakdown of one CuttingOutput entry's rejected quantity. */
export interface CuttingRejection {
  id: string;
  cuttingOutputId: string;
  cuttingBatchId: string;
  cuttingOrderId: string;
  reasonId: string;
  quantity: number;
  notes?: string;
  recordedBy: string;
  timestamp: string;
}

/** Unused fabric physically sent back from cutting to the warehouse. */
export interface MaterialReturn {
  id: string;
  returnNumber: string;
  cuttingOrderId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  warehouseId: string;
  locationId: string;
  reason?: string;
  returnedBy: string;
  returnedDate: string;
  movementId: string;
}

/**
 * "Ready for Sewing" is the final meaningful state Phase 7 itself produces. "Assigned" /
 * "Issued to Sewing" / "In Sewing" / "Partially Completed" / "Completed" (as a sewing outcome)
 * are driven by Phase 8's sewing workflow — see `lib/sewing-utils.ts`.
 */
export type BundleStatus =
  | "created"
  | "pending_verification"
  | "ready_for_sewing"
  | "assigned"
  | "issued_to_sewing"
  | "in_sewing"
  | "partially_completed"
  | "completed"
  | "on_hold"
  | "cancelled";

export interface BundleItem {
  id: string;
  sizeId: string;
  sizeCode: string;
  quantity: number;
}

/** A traceable group of cut, good-quality pieces that will move through Sewing as one unit. */
export interface Bundle {
  id: string;
  bundleNumber: string;
  cuttingBatchId: string;
  cuttingPlanId: string;
  cuttingOrderId: string;
  productionOrderId: string;
  productionOrderNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  styleId: string;
  styleCode: string;
  skuId?: string;
  colorId: string;
  colorName: string;
  materialId: string;
  materialName: string;
  /** Supports mixed-size bundles even though the Phase 7 UI only ever generates single-size ones. */
  items: BundleItem[];
  /** Sum of `items` quantities, denormalized for display. */
  quantity: number;
  status: BundleStatus;
  verifiedBy?: string;
  verifiedDate?: string;
  createdBy: string;
  createdDate: string;
}

/** Configurable reason code — backs both Wastage Reasons and Cutting Rejection Reasons. */
export interface ReasonCode {
  id: string;
  label: string;
  status: MasterStatus;
}

// ---------------------------------------------------------------------------
// Sewing Production (Phase 8)
// ---------------------------------------------------------------------------

export type SewingOrderStatus =
  | "planned"
  | "assigned"
  | "ready"
  | "in_progress"
  | "partially_completed"
  | "on_hold"
  | "processing_complete"
  | "completed"
  | "cancelled";

/**
 * "What needs to be sewn", built from one or more Bundles off a Production Order. Never assume
 * 1 Production Order = 1 Sewing Order — a production order's bundles can be split across several
 * Sewing Orders (by line, by date, by run). Always traces back to exactly one Production Order.
 */
export interface SewingOrder {
  id: string;
  sewingOrderNumber: string;
  productionOrderId: string;
  productionOrderNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  styleId: string;
  styleCode: string;
  styleName: string;
  colorId: string;
  colorName: string;
  skuId?: string;
  /** Sum of assigned bundle quantities — the total this sewing order is responsible for. */
  quantity: number;
  unit: string;
  priority: OrderPriority;
  productionLineId?: string;
  supervisor?: string;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  status: SewingOrderStatus;
  holdReason?: string;
  createdDate: string;
  notes?: string;
}

/** Links one Bundle to the Sewing Order it has been assigned to. A bundle belongs to at most one active sewing order. */
export interface SewingOrderBundle {
  id: string;
  sewingOrderId: string;
  bundleId: string;
  bundleNumber: string;
  quantity: number;
  assignedDate: string;
}

/**
 * One "record production" event against a bundle within a Sewing Order. Bundle and Sewing Order
 * totals are always the sum of these entries — never edited directly. `inputQuantity` must equal
 * `goodQuantity + rejectedQuantity + reworkQuantity` (enforced by the recording form/service).
 */
export interface SewingProductionEntry {
  id: string;
  sewingOrderId: string;
  bundleId: string;
  bundleNumber: string;
  date: string;
  inputQuantity: number;
  goodQuantity: number;
  rejectedQuantity: number;
  reworkQuantity: number;
  notes?: string;
  recordedBy: string;
  recordedDate: string;
}

/** Reason-level record behind a production entry's rejected + rework quantity — mirrors CuttingRejection. */
export interface SewingDefect {
  id: string;
  sewingOrderId: string;
  bundleId: string;
  productionEntryId: string;
  reasonId: string;
  /** Rejected + Rework quantity for this entry, per the "Defect Quantity" rule — never double-counted. */
  quantity: number;
  notes?: string;
  recordedBy: string;
  date: string;
}

export type SewingReworkStatus = "pending" | "in_progress" | "completed" | "rejected";

/** Tracks one batch of rework pieces through to a final good/rejected split. Basic — no multi-stage rework routing. */
export interface SewingRework {
  id: string;
  reworkNumber: string;
  sewingOrderId: string;
  bundleId: string;
  productionEntryId: string;
  defectId?: string;
  quantity: number;
  reasonId: string;
  status: SewingReworkStatus;
  /** Set only once the rework is resolved — completedQuantity + rejectedQuantity always equals `quantity`. */
  completedQuantity?: number;
  rejectedQuantity?: number;
  createdDate: string;
  completedDate?: string;
  recordedBy: string;
}

/** Configurable operation master — e.g. Pocket Attachment, Side Seam, Hem. Sequence is suggested, not an enforced workflow. */
export interface SewingOperation {
  id: string;
  code: string;
  name: string;
  sequence: number;
  status: MasterStatus;
}

/** Basic association of an Operation to a Production Line and, optionally, the Operator running it. */
export interface SewingLineOperation {
  id: string;
  productionLineId: string;
  operationId: string;
  sequence: number;
  operatorId?: string;
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
