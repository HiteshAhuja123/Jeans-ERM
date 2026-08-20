import { getAvailableStock } from "@/lib/inventory-utils";
import type {
  Bundle,
  BundleStatus,
  CuttingBatch,
  CuttingBatchStatus,
  CuttingOrderStatus,
  CuttingOutput,
  InventoryBalance,
  OrderItemSizeQty,
  StatusLevel,
} from "@/types";

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

export function generateCuttingOrderNumber(existing: Array<{ cuttingOrderNumber: string }>, year = new Date().getFullYear()): string {
  return nextSequenceNumber(existing.map((c) => c.cuttingOrderNumber), `CUT-${year}-`, 5);
}

export function generateFabricAllocationNumber(existing: Array<{ allocationNumber: string }>, year = new Date().getFullYear()): string {
  return nextSequenceNumber(existing.map((a) => a.allocationNumber), `FA-${year}-`, 5);
}

export function generateCuttingPlanNumber(existing: Array<{ planNumber: string }>, year = new Date().getFullYear()): string {
  return nextSequenceNumber(existing.map((p) => p.planNumber), `CP-${year}-`, 4);
}

export function generateCuttingBatchNumber(existing: Array<{ batchNumber: string }>, year = new Date().getFullYear()): string {
  return nextSequenceNumber(existing.map((b) => b.batchNumber), `CB-${year}-`, 4);
}

export function generateBundleNumber(existing: Array<{ bundleNumber: string }>, year = new Date().getFullYear()): string {
  return nextSequenceNumber(existing.map((b) => b.bundleNumber), `BND-${year}-`, 5);
}

export function generateMaterialReturnNumber(existing: Array<{ returnNumber: string }>, year = new Date().getFullYear()): string {
  return nextSequenceNumber(existing.map((r) => r.returnNumber), `RET-${year}-`, 4);
}

// ---------------------------------------------------------------------------
// Cutting quantity rules — Good Output = Cut - Rejected, never stored twice.
// ---------------------------------------------------------------------------

export function getBatchCutQuantity(batchId: string, outputs: CuttingOutput[]): number {
  return outputs.filter((o) => o.cuttingBatchId === batchId).reduce((sum, o) => sum + o.cutQuantity, 0);
}

export function getBatchRejectedQuantity(batchId: string, outputs: CuttingOutput[]): number {
  return outputs.filter((o) => o.cuttingBatchId === batchId).reduce((sum, o) => sum + o.rejectedQuantity, 0);
}

/** Good Output = Cut Quantity - Rejected Quantity — always derived, never entered directly. */
export function getBatchGoodOutput(batchId: string, outputs: CuttingOutput[]): number {
  return Math.max(0, getBatchCutQuantity(batchId, outputs) - getBatchRejectedQuantity(batchId, outputs));
}

export function getBatchFabricUsed(batchId: string, outputs: CuttingOutput[]): number {
  return outputs.filter((o) => o.cuttingBatchId === batchId).reduce((sum, o) => sum + o.fabricUsed, 0);
}

/** Merges every recorded entry's good-piece size breakdown into one per-batch total. */
export function getBatchSizeBreakdown(batchId: string, outputs: CuttingOutput[]): OrderItemSizeQty[] {
  const totals = new Map<string, number>();
  for (const output of outputs) {
    if (output.cuttingBatchId !== batchId) continue;
    for (const line of output.sizeBreakdown) {
      totals.set(line.sizeId, (totals.get(line.sizeId) ?? 0) + line.quantity);
    }
  }
  return Array.from(totals.entries()).map(([sizeId, quantity]) => ({ sizeId, quantity }));
}

/** Remaining Cut Quantity = Planned Cut Quantity - Cut Quantity. */
export function getRemainingCutQuantity(plannedQuantity: number, cutQuantity: number): number {
  return Math.max(0, plannedQuantity - cutQuantity);
}

export function getCuttingOrderCutQuantity(orderId: string, batches: CuttingBatch[], outputs: CuttingOutput[]): number {
  return batches
    .filter((b) => b.cuttingOrderId === orderId)
    .reduce((sum, b) => sum + getBatchCutQuantity(b.id, outputs), 0);
}

export function getCuttingOrderRejectedQuantity(orderId: string, batches: CuttingBatch[], outputs: CuttingOutput[]): number {
  return batches
    .filter((b) => b.cuttingOrderId === orderId)
    .reduce((sum, b) => sum + getBatchRejectedQuantity(b.id, outputs), 0);
}

export function getCuttingOrderGoodOutput(orderId: string, batches: CuttingBatch[], outputs: CuttingOutput[]): number {
  return Math.max(0, getCuttingOrderCutQuantity(orderId, batches, outputs) - getCuttingOrderRejectedQuantity(orderId, batches, outputs));
}

export function getCuttingOrderFabricUsed(orderId: string, batches: CuttingBatch[], outputs: CuttingOutput[]): number {
  return batches
    .filter((b) => b.cuttingOrderId === orderId)
    .reduce((sum, b) => sum + getBatchFabricUsed(b.id, outputs), 0);
}

// ---------------------------------------------------------------------------
// Bundling quantity rules — bundled quantity may never exceed available good output.
// ---------------------------------------------------------------------------

const activeBundleStatuses: BundleStatus[] = [
  "created",
  "pending_verification",
  "ready_for_sewing",
  "issued_to_sewing",
  "in_sewing",
  "completed",
  "on_hold",
];

export function getBundledQuantity(cuttingBatchId: string, bundles: Bundle[]): number {
  return bundles
    .filter((b) => b.cuttingBatchId === cuttingBatchId && activeBundleStatuses.includes(b.status))
    .reduce((sum, b) => sum + b.quantity, 0);
}

export function getBundledQuantityBySize(cuttingBatchId: string, sizeId: string, bundles: Bundle[]): number {
  return bundles
    .filter((b) => b.cuttingBatchId === cuttingBatchId && activeBundleStatuses.includes(b.status))
    .flatMap((b) => b.items)
    .filter((item) => item.sizeId === sizeId)
    .reduce((sum, item) => sum + item.quantity, 0);
}

/** Available for Bundling = Good Cut Output - Already Bundled Quantity. Never negative. */
export function getAvailableForBundling(batchId: string, outputs: CuttingOutput[], bundles: Bundle[]): number {
  return Math.max(0, getBatchGoodOutput(batchId, outputs) - getBundledQuantity(batchId, bundles));
}

export function getAvailableForBundlingBySize(batchId: string, sizeId: string, outputs: CuttingOutput[], bundles: Bundle[]): number {
  const goodForSize = getBatchSizeBreakdown(batchId, outputs).find((line) => line.sizeId === sizeId)?.quantity ?? 0;
  return Math.max(0, goodForSize - getBundledQuantityBySize(batchId, sizeId, bundles));
}

export function getReadyForSewingQuantity(cuttingOrderId: string, batches: CuttingBatch[], bundles: Bundle[]): number {
  const batchIds = new Set(batches.filter((b) => b.cuttingOrderId === cuttingOrderId).map((b) => b.id));
  return bundles
    .filter((b) => batchIds.has(b.cuttingBatchId) && (b.status === "ready_for_sewing" || b.status === "issued_to_sewing" || b.status === "in_sewing" || b.status === "completed"))
    .reduce((sum, b) => sum + b.quantity, 0);
}

// ---------------------------------------------------------------------------
// Fabric reconciliation & efficiency
// ---------------------------------------------------------------------------

export interface FabricReconciliation {
  issued: number;
  used: number;
  returned: number;
  /** Issued - Used - Returned. Never hardcoded — always calculated from the actual values. */
  wastage: number;
  wastagePercent: number;
  /** Should always be 0. A positive value means Used + Returned exceeded Issued — a data problem, surfaced rather than hidden. */
  unaccounted: number;
}

export function getFabricReconciliation(issued: number, used: number, returned: number): FabricReconciliation {
  const residual = issued - used - returned;
  const wastage = Math.max(0, residual);
  const unaccounted = Math.max(0, -residual);
  const wastagePercent = issued > 0 ? (wastage / issued) * 100 : 0;
  return { issued, used, returned, wastage, wastagePercent, unaccounted };
}

/** Cutting Efficiency = Good Output / Planned Output — a production metric, distinct from fabric utilization. */
export function getCuttingEfficiency(plannedQuantity: number, goodOutput: number): number {
  return plannedQuantity > 0 ? Math.round((goodOutput / plannedQuantity) * 100) : 0;
}

export type MaterialReadiness = "ready" | "shortage" | "unknown";

export function getMaterialReadiness(required: number, available: number): MaterialReadiness {
  if (required <= 0) return "unknown";
  return available >= required ? "ready" : "shortage";
}

export const materialReadinessMeta: Record<MaterialReadiness, { label: string; level: StatusLevel }> = {
  ready: { label: "Ready", level: "success" },
  shortage: { label: "Material Shortage", level: "critical" },
  unknown: { label: "Unknown", level: "neutral" },
};

/** Fabric currently sitting available in the warehouse for a material — the same rule Phase 5 inventory uses. */
export function getAvailableFabric(balance: InventoryBalance | undefined): number {
  return balance ? getAvailableStock(balance) : 0;
}

/**
 * "Start Cutting" gate — for Phase 7 this is a hard rule with no override: fabric issued to the
 * cutting order must at least cover what the plan requires.
 */
export function canStartCutting(fabricRequired: number, fabricIssued: number): boolean {
  return fabricRequired <= 0 || fabricIssued >= fabricRequired;
}

// ---------------------------------------------------------------------------
// Cutting matrix (size x color)
// ---------------------------------------------------------------------------

export interface CuttingMatrixEntry {
  colorId: string;
  colorName: string;
  sizeId: string;
  quantity: number;
}

export interface CuttingMatrixRow {
  colorId: string;
  colorName: string;
  bySize: Record<string, number>;
  total: number;
}

export interface CuttingMatrix {
  rows: CuttingMatrixRow[];
  sizeIds: string[];
  columnTotals: Record<string, number>;
  grandTotal: number;
}

/** Builds a size x color pivot from flat (color, size, quantity) entries, with totals computed automatically. */
export function buildCuttingMatrix(entries: CuttingMatrixEntry[]): CuttingMatrix {
  const rowsByColor = new Map<string, CuttingMatrixRow>();
  const columnTotals: Record<string, number> = {};
  const sizeOrder: string[] = [];

  for (const entry of entries) {
    if (entry.quantity <= 0) continue;
    if (!sizeOrder.includes(entry.sizeId)) sizeOrder.push(entry.sizeId);

    const row = rowsByColor.get(entry.colorId) ?? { colorId: entry.colorId, colorName: entry.colorName, bySize: {}, total: 0 };
    row.bySize[entry.sizeId] = (row.bySize[entry.sizeId] ?? 0) + entry.quantity;
    row.total += entry.quantity;
    rowsByColor.set(entry.colorId, row);

    columnTotals[entry.sizeId] = (columnTotals[entry.sizeId] ?? 0) + entry.quantity;
  }

  const grandTotal = Object.values(columnTotals).reduce((sum, qty) => sum + qty, 0);
  return { rows: Array.from(rowsByColor.values()), sizeIds: sizeOrder, columnTotals, grandTotal };
}

// ---------------------------------------------------------------------------
// Status lifecycle
// ---------------------------------------------------------------------------

export type CuttingOrderEditTier = "full" | "limited" | "readonly";

export function getCuttingOrderEditTier(status: CuttingOrderStatus): CuttingOrderEditTier {
  switch (status) {
    case "pending":
    case "material_check":
    case "ready":
      return "full";
    case "in_progress":
    case "on_hold":
    case "partially_completed":
      return "limited";
    case "completed":
    case "cancelled":
      return "readonly";
  }
}

/** Manual transitions only — moving to "in_progress" happens through the dedicated Start Cutting action. */
export function getNextCuttingOrderStatusOptions(status: CuttingOrderStatus): CuttingOrderStatus[] {
  switch (status) {
    case "pending":
      return ["material_check", "cancelled"];
    case "material_check":
      return ["ready", "cancelled"];
    case "ready":
      return ["cancelled"];
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

export function getNextCuttingBatchStatusOptions(status: CuttingBatchStatus): CuttingBatchStatus[] {
  switch (status) {
    case "pending":
      return ["in_progress", "cancelled"];
    case "in_progress":
      return ["on_hold", "completed", "cancelled"];
    case "on_hold":
      return ["in_progress", "cancelled"];
    case "completed":
    case "cancelled":
      return [];
  }
}

/**
 * "Ready for Sewing" is reached only through the dedicated Verify action, not this generic menu.
 * "Assigned" / "Issued to Sewing" / "In Sewing" / "Partially Completed" are driven entirely by the
 * Phase 8 sewing workflow (assignment, start, production entries) — not this menu either.
 */
export function getNextBundleStatusOptions(status: BundleStatus): BundleStatus[] {
  switch (status) {
    case "created":
      return ["pending_verification", "cancelled"];
    case "pending_verification":
      return ["on_hold", "cancelled"];
    case "ready_for_sewing":
      return ["on_hold", "cancelled"];
    case "assigned":
    case "partially_completed":
      return ["on_hold", "cancelled"];
    case "on_hold":
      return ["pending_verification", "cancelled"];
    case "issued_to_sewing":
    case "in_sewing":
    case "completed":
    case "cancelled":
      return [];
  }
}
