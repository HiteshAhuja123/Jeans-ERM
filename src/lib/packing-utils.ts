import type {
  PackingCarton,
  PackingEntry,
  PackingOrder,
  PackingOrderStatus,
  ProductionOrder,
  ProductionStageKey,
  QcInspectionEntry,
  QcOrder,
  QcRework,
} from "@/types";
import { getQcQuantitySummary } from "@/lib/post-sewing-utils";

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

export function generatePackingOrderNumber(existing: Array<{ packingOrderNumber: string }>, year = new Date().getFullYear()): string {
  return nextSequenceNumber(existing.map((o) => o.packingOrderNumber), `PACK-${year}-`, 5);
}

/** Carton numbers are scoped to one Packing Order, e.g. "PACK-2026-00001-C001". */
export function generateCartonNumbers(packingOrderNumber: string, existingForOrder: PackingCarton[], count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${packingOrderNumber}-C${String(existingForOrder.length + i + 1).padStart(3, "0")}`);
}

// ---------------------------------------------------------------------------
// QC -> Packing handoff
// ---------------------------------------------------------------------------

const openPackingStatuses: PackingOrderStatus[] = ["planned", "in_progress", "partially_packed", "packed"];

export function getQcOrderPackingCommitted(qcOrderId: string, packingOrders: PackingOrder[]): number {
  return packingOrders.filter((p) => p.qcOrderId === qcOrderId && openPackingStatuses.includes(p.status)).reduce((sum, p) => sum + p.quantity, 0);
}

/**
 * Remaining QC-passed quantity from this QC Order still available to send into Packing. Only
 * "approved" QC Orders ever have packable quantity — a pending-approval order might still send
 * more pieces to rework, so nothing is packable until QC is fully resolved.
 */
export function getQcOrderAvailableForPacking(
  qcOrder: QcOrder,
  qcEntries: QcInspectionEntry[],
  qcReworks: QcRework[],
  packingOrders: PackingOrder[],
): number {
  if (qcOrder.status !== "approved") return 0;
  const summary = getQcQuantitySummary(qcOrder, qcEntries, qcReworks);
  const committed = getQcOrderPackingCommitted(qcOrder.id, packingOrders);
  return Math.max(0, summary.passed - committed);
}

// ---------------------------------------------------------------------------
// Packing — packed = sum of entries, cartons = sum of entries' cartonCount
// ---------------------------------------------------------------------------

export function getPackingOrderEntries(packingOrderId: string, entries: PackingEntry[]): PackingEntry[] {
  return entries.filter((e) => e.packingOrderId === packingOrderId);
}

export function getPackingOrderPackedQuantity(packingOrderId: string, entries: PackingEntry[]): number {
  return getPackingOrderEntries(packingOrderId, entries).reduce((sum, e) => sum + e.packedQuantity, 0);
}

export function getPackingOrderCartonCount(packingOrderId: string, entries: PackingEntry[]): number {
  return getPackingOrderEntries(packingOrderId, entries).reduce((sum, e) => sum + e.cartonCount, 0);
}

export interface PackingQuantitySummary {
  planned: number;
  packed: number;
  cartons: number;
  remaining: number;
}

export function getPackingOrderQuantitySummary(order: Pick<PackingOrder, "id" | "quantity">, entries: PackingEntry[]): PackingQuantitySummary {
  const packed = getPackingOrderPackedQuantity(order.id, entries);
  return {
    planned: order.quantity,
    packed,
    cartons: getPackingOrderCartonCount(order.id, entries),
    remaining: Math.max(0, order.quantity - packed),
  };
}

export interface PackingEntryValidation {
  valid: boolean;
  message?: string;
}

export function validatePackingEntry(packedQuantity: number, cartonCount: number, maxPack: number): PackingEntryValidation {
  if (maxPack <= 0) return { valid: false, message: "This packing order has already been fully packed." };
  if (!(packedQuantity > 0)) return { valid: false, message: "Enter a packed quantity greater than 0" };
  if (packedQuantity > maxPack) {
    return { valid: false, message: `Only ${maxPack.toLocaleString()} pieces are available to pack` };
  }
  if (!(cartonCount > 0) || !Number.isInteger(cartonCount)) {
    return { valid: false, message: "Enter at least 1 carton" };
  }
  if (cartonCount > packedQuantity) {
    return { valid: false, message: "Cannot have more cartons than pieces packed" };
  }
  return { valid: true };
}

export function derivePackingOrderStatus(currentStatus: PackingOrderStatus, summary: PackingQuantitySummary): PackingOrderStatus {
  if (currentStatus === "cancelled" || currentStatus === "on_hold") return currentStatus;
  if (summary.planned > 0 && summary.packed >= summary.planned) return "packed";
  if (summary.packed > 0) return "partially_packed";
  return currentStatus;
}

export type PackingOrderEditTier = "full" | "limited" | "readonly";

export function getPackingOrderEditTier(status: PackingOrderStatus): PackingOrderEditTier {
  switch (status) {
    case "planned":
      return "full";
    case "in_progress":
    case "partially_packed":
    case "on_hold":
      return "limited";
    case "packed":
    case "cancelled":
      return "readonly";
  }
}

export function getNextPackingOrderStatusOptions(status: PackingOrderStatus): PackingOrderStatus[] {
  switch (status) {
    case "planned":
    case "in_progress":
    case "partially_packed":
    case "on_hold":
      return ["cancelled"];
    case "packed":
    case "cancelled":
      return [];
  }
}

// ---------------------------------------------------------------------------
// Production Order stage sync — Packing -> Dispatch
// ---------------------------------------------------------------------------

export interface ProductionOrderStageSync {
  currentStage: ProductionStageKey;
  quantityProduced: number;
}

const stageOrder: ProductionStageKey[] = ["cutting", "sewing", "washing", "finishing", "qc", "packing", "dispatch"];

function stageIndex(stage: ProductionStageKey): number {
  return stageOrder.indexOf(stage);
}

/**
 * Reaching "dispatch" here means Ready for Dispatch (every Packing Order for this Production
 * Order is fully Packed) — not that a dispatch has happened yet (Dispatch itself owns that,
 * driven off Finished Goods rather than off Production Order stage).
 */
export function syncStageOnPacking(productionOrder: Pick<ProductionOrder, "currentStage">, packingOrders: PackingOrder[]): ProductionOrderStageSync | null {
  const active = packingOrders.filter((p) => p.status !== "cancelled");
  if (active.length === 0) return null;
  const allPacked = active.every((p) => p.status === "packed");
  const targetStage: ProductionStageKey = allPacked ? "dispatch" : "packing";
  if (stageIndex(productionOrder.currentStage) >= stageIndex(targetStage)) return null;
  return { currentStage: targetStage, quantityProduced: active.reduce((sum, p) => sum + p.quantity, 0) };
}
