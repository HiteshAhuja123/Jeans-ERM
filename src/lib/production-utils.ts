import { getAvailableStock, getOnOrderQuantity } from "@/lib/inventory-utils";
import type {
  Bom,
  InventoryBalance,
  Order,
  OrderLineItem,
  ProductionLine,
  ProductionOrder,
  ProductionOrderStatus,
  ProductionStageKey,
  ProductionStageProgress,
  PurchaseOrder,
  StatusLevel,
} from "@/types";

export const productionStageOrderList: ProductionStageKey[] = [
  "cutting",
  "sewing",
  "washing",
  "finishing",
  "qc",
  "packing",
  "dispatch",
];

/** Visualization-only stage breakdown for a Production Order — not driven by real execution transactions yet. */
export function buildProductionStageProgress(po: ProductionOrder): ProductionStageProgress[] {
  const currentIndex = productionStageOrderList.indexOf(po.currentStage);
  const isFinished = po.status === "completed";
  const isCancelled = po.status === "cancelled";

  return productionStageOrderList.map((stage, index) => {
    if (isCancelled) {
      return { stage, status: "blocked", completedPieces: 0, totalPieces: po.quantity };
    }
    if (isFinished || index < currentIndex) {
      return { stage, status: "done", completedPieces: po.quantity, totalPieces: po.quantity };
    }
    if (index === currentIndex) {
      return { stage, status: po.status === "on_hold" ? "blocked" : "in_progress", completedPieces: po.quantityProduced, totalPieces: po.quantity };
    }
    return { stage, status: "pending", completedPieces: 0, totalPieces: po.quantity };
  });
}

// ---------------------------------------------------------------------------
// Order <-> Production Order quantity reconciliation
// ---------------------------------------------------------------------------

const activePoStatuses: ProductionOrderStatus[] = [
  "draft",
  "planned",
  "released",
  "in_progress",
  "on_hold",
  "partially_completed",
  "completed",
];

/** Sum of non-cancelled Production Order quantity already planned against one Order line item. */
export function getPlannedQuantity(lineItemId: string, productionOrders: ProductionOrder[]): number {
  return productionOrders
    .filter((po) => po.orderLineItemId === lineItemId && activePoStatuses.includes(po.status))
    .reduce((sum, po) => sum + po.quantity, 0);
}

/** Remaining line-item quantity still available to plan into a new Production Order. */
export function getRemainingQuantity(lineItem: Pick<OrderLineItem, "id" | "quantity">, productionOrders: ProductionOrder[]): number {
  return Math.max(0, lineItem.quantity - getPlannedQuantity(lineItem.id, productionOrders));
}

// ---------------------------------------------------------------------------
// Numbering
// ---------------------------------------------------------------------------

function nextSequenceNumber(existingNumbers: string[], prefix: string, digits: number): string {
  const maxSeq = existingNumbers.reduce((max, number) => {
    if (!number.startsWith(prefix)) return max;
    const seq = Number(number.slice(prefix.length));
    return Number.isFinite(seq) ? Math.max(max, seq) : max;
  }, 0);
  return `${prefix}${String(maxSeq + 1).padStart(digits, "0")}`;
}

export function generateProductionOrderNumber(existing: ProductionOrder[], year = new Date().getFullYear()): string {
  return nextSequenceNumber(existing.map((po) => po.productionOrderNumber), `PROD-${year}-`, 5);
}

export function generatePlanNumber(existing: Array<{ planNumber: string }>, year = new Date().getFullYear()): string {
  return nextSequenceNumber(existing.map((p) => p.planNumber), `PLAN-${year}-`, 4);
}

// ---------------------------------------------------------------------------
// BOM / Material requirement
// ---------------------------------------------------------------------------

export interface MaterialRequirementLine {
  materialId: string;
  materialCode: string;
  materialName: string;
  unit: string;
  /** Base quantity before wastage. */
  baseRequired: number;
  wastagePercent: number;
  /** Base + wastage — the true quantity to draw from stock. */
  required: number;
  available: number;
  reserved: number;
  onOrder: number;
  shortage: number;
  status: "available" | "shortage" | "unknown";
}

/** Required = qty/piece * production quantity, inflated by the BOM line's configurable wastage %. */
export function computeMaterialRequirements(
  productionQuantity: number,
  bom: Bom | undefined,
  balances: InventoryBalance[],
  purchaseOrders: PurchaseOrder[],
): MaterialRequirementLine[] {
  if (!bom) return [];
  return bom.items.map((item) => {
    const baseRequired = item.quantityPerPiece * productionQuantity;
    const required = baseRequired * (1 + item.wastagePercent / 100);
    const balance = balances.find((b) => b.materialId === item.materialId);
    const available = balance ? getAvailableStock(balance) : 0;
    const onOrder = getOnOrderQuantity(item.materialId, purchaseOrders);
    const shortage = Math.max(0, required - available);
    return {
      materialId: item.materialId,
      materialCode: item.materialCode,
      materialName: item.materialName,
      unit: item.unit,
      baseRequired,
      wastagePercent: item.wastagePercent,
      required,
      available,
      reserved: balance?.reserved ?? 0,
      onOrder,
      shortage,
      status: balance ? (shortage > 0 ? "shortage" : "available") : "unknown",
    };
  });
}

export type MaterialAvailability = "ready" | "partial" | "shortage" | "unknown";

export function getMaterialAvailability(lines: MaterialRequirementLine[]): MaterialAvailability {
  if (lines.length === 0) return "unknown";
  if (lines.some((l) => l.status === "unknown")) return "unknown";
  const shortages = lines.filter((l) => l.status === "shortage").length;
  if (shortages === 0) return "ready";
  if (shortages === lines.length) return "shortage";
  return "partial";
}

export const materialAvailabilityMeta: Record<MaterialAvailability, { label: string; level: StatusLevel }> = {
  ready: { label: "Material Ready", level: "success" },
  partial: { label: "Partially Ready", level: "warning" },
  shortage: { label: "Material Shortage", level: "critical" },
  unknown: { label: "Unknown", level: "neutral" },
};

// ---------------------------------------------------------------------------
// Capacity
// ---------------------------------------------------------------------------

function daysBetweenInclusive(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

function isDateWithinRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

const activeScheduleStatuses: ProductionOrderStatus[] = ["planned", "released", "in_progress", "on_hold", "partially_completed"];

/** Approximates a line's load on a given day by spreading each order's quantity evenly across its planned window. */
export function getLineDailyLoad(lineId: string, date: string, productionOrders: ProductionOrder[]): number {
  return productionOrders
    .filter(
      (po) =>
        po.productionLineId === lineId &&
        activeScheduleStatuses.includes(po.status) &&
        isDateWithinRange(date, po.plannedStart, po.plannedEnd),
    )
    .reduce((sum, po) => sum + po.quantity / daysBetweenInclusive(po.plannedStart, po.plannedEnd), 0);
}

export interface LineCapacitySnapshot {
  lineId: string;
  lineName: string;
  date: string;
  dailyCapacity: number;
  planned: number;
  available: number;
  utilizationPercent: number;
}

export function getLineCapacitySnapshot(line: ProductionLine, date: string, productionOrders: ProductionOrder[]): LineCapacitySnapshot {
  const planned = Math.round(getLineDailyLoad(line.id, date, productionOrders));
  const available = Math.max(0, line.capacity - planned);
  const utilizationPercent = line.capacity > 0 ? Math.round((planned / line.capacity) * 100) : 0;
  return { lineId: line.id, lineName: line.name, date, dailyCapacity: line.capacity, planned, available, utilizationPercent };
}

// ---------------------------------------------------------------------------
// Delivery risk / readiness
// ---------------------------------------------------------------------------

export interface DeliveryRisk {
  atRisk: boolean;
  bufferDays: number;
}

/** Buffer = days between planned completion and the delivery date. Negative means production finishes too late. */
export function getDeliveryRisk(productionOrder: Pick<ProductionOrder, "plannedEnd">, order: Pick<Order, "dueDate">): DeliveryRisk {
  const ms = new Date(order.dueDate).setHours(0, 0, 0, 0) - new Date(productionOrder.plannedEnd).setHours(0, 0, 0, 0);
  const bufferDays = Math.round(ms / (1000 * 60 * 60 * 24));
  return { atRisk: bufferDays < 0, bufferDays };
}

export interface ProductionReadiness {
  materialReady: boolean;
  lineAssigned: boolean;
  scheduleSet: boolean;
  capacityOk: boolean;
  overall: "ready" | "not_ready";
}

export function getProductionReadiness(
  productionOrder: Pick<ProductionOrder, "productionLineId" | "plannedStart" | "plannedEnd">,
  materialAvailability: MaterialAvailability,
  capacityOk: boolean,
): ProductionReadiness {
  const materialReady = materialAvailability === "ready" || materialAvailability === "unknown";
  const lineAssigned = Boolean(productionOrder.productionLineId);
  const scheduleSet = Boolean(productionOrder.plannedStart && productionOrder.plannedEnd);
  const overall: "ready" | "not_ready" = materialReady && lineAssigned && scheduleSet && capacityOk ? "ready" : "not_ready";
  return { materialReady, lineAssigned, scheduleSet, capacityOk, overall };
}

// ---------------------------------------------------------------------------
// Status lifecycle
// ---------------------------------------------------------------------------

export type ProductionOrderEditTier = "full" | "limited" | "readonly";

export function getProductionOrderEditTier(status: ProductionOrderStatus): ProductionOrderEditTier {
  switch (status) {
    case "draft":
    case "planned":
      return "full";
    case "released":
    case "in_progress":
    case "on_hold":
    case "partially_completed":
      return "limited";
    case "completed":
    case "cancelled":
      return "readonly";
  }
}

export function getNextProductionOrderStatusOptions(status: ProductionOrderStatus): ProductionOrderStatus[] {
  switch (status) {
    case "draft":
      return ["planned", "cancelled"];
    case "planned":
      return ["cancelled"]; // released happens via the dedicated Release action, not this menu
    case "released":
      return ["in_progress", "on_hold", "cancelled"];
    case "in_progress":
      return ["on_hold", "partially_completed", "completed", "cancelled"];
    case "on_hold":
      return ["in_progress", "cancelled"];
    case "partially_completed":
      return ["completed", "cancelled"];
    case "completed":
    case "cancelled":
      return [];
  }
}
