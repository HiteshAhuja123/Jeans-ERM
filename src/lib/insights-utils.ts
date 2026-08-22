import type {
  DispatchOrder,
  FinishedGoodsBalance,
  Order,
  PackingOrder,
  ProductionOrder,
  ProductionOrderStatus,
  ProductionStageKey,
  QcInspectionEntry,
  QcOrder,
  QcRework,
} from "@/types";
import { getFinishedGoodsAvailable } from "@/lib/finished-goods-utils";
import { getQcQuantitySummary } from "@/lib/post-sewing-utils";

// ---------------------------------------------------------------------------
// Production insights — planned vs actual, delayed, pending, due soon.
// Single source of truth for the Production dashboard, Management dashboard and Reports.
// ---------------------------------------------------------------------------

const activeProductionStatuses: ProductionOrderStatus[] = ["planned", "released", "in_progress", "on_hold", "partially_completed"];
const pendingProductionStatuses: ProductionOrderStatus[] = ["draft", "planned"];

export interface ProductionInsights {
  active: ProductionOrder[];
  pending: ProductionOrder[];
  dueToday: ProductionOrder[];
  dueThisWeek: ProductionOrder[];
  delayed: ProductionOrder[];
  completed: ProductionOrder[];
  plannedQty: number;
  completedQty: number;
}

export function getProductionInsights(productionOrders: ProductionOrder[], today: string, weekOut: string): ProductionInsights {
  const active = productionOrders.filter((po) => activeProductionStatuses.includes(po.status));
  const pending = productionOrders.filter((po) => pendingProductionStatuses.includes(po.status));
  const dueToday = active.filter((po) => po.plannedEnd === today);
  const dueThisWeek = active.filter((po) => po.plannedEnd >= today && po.plannedEnd <= weekOut);
  const delayed = active.filter((po) => po.plannedEnd < today);
  const completed = productionOrders.filter((po) => po.status === "completed");
  const plannedQty = productionOrders.filter((po) => po.status !== "cancelled").reduce((sum, po) => sum + po.quantity, 0);
  const completedQty = productionOrders.reduce((sum, po) => sum + po.quantityProduced, 0);
  return { active, pending, dueToday, dueThisWeek, delayed, completed, plannedQty, completedQty };
}

export interface StageLoad {
  stage: ProductionStageKey;
  count: number;
  quantity: number;
}

const stageOrder: ProductionStageKey[] = ["cutting", "sewing", "washing", "finishing", "qc", "packing", "dispatch"];

/**
 * Practical bottleneck signal: which stage currently has the most active Production Orders
 * sitting in it. We don't track per-stage entry timestamps globally, so "most orders parked
 * here right now" is the honest proxy available from existing data — not a dwell-time model.
 */
export function getStageLoad(productionOrders: ProductionOrder[]): StageLoad[] {
  const active = productionOrders.filter((po) => activeProductionStatuses.includes(po.status));
  return stageOrder.map((stage) => {
    const inStage = active.filter((po) => po.currentStage === stage);
    return { stage, count: inStage.length, quantity: inStage.reduce((sum, po) => sum + po.quantity, 0) };
  });
}

export function getBottleneckStage(productionOrders: ProductionOrder[]): StageLoad | null {
  const loads = getStageLoad(productionOrders).filter((l) => l.count > 0);
  if (loads.length === 0) return null;
  return loads.reduce((max, l) => (l.count > max.count ? l : max), loads[0]);
}

// ---------------------------------------------------------------------------
// Order insights — approaching deadline.
// ---------------------------------------------------------------------------

const openOrderStatuses = ["confirmed", "in_production", "partially_completed"];

/** Orders due within `withinDays` that aren't already completed/dispatched/cancelled. */
export function getOrdersApproachingDeadline(orders: Order[], today: string, withinDays: number): Order[] {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + withinDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return orders.filter((o) => openOrderStatuses.includes(o.status) && o.dueDate >= today && o.dueDate <= cutoffStr);
}

// ---------------------------------------------------------------------------
// Quality insights — aggregate pass/rework/reject across every QC order.
// ---------------------------------------------------------------------------

export interface QualityInsights {
  inspected: number;
  passed: number;
  pendingRework: number;
  rejected: number;
  passRate: number;
  onHoldOrders: QcOrder[];
}

export function getQualityInsights(qcOrders: QcOrder[], qcEntries: QcInspectionEntry[], qcReworks: QcRework[]): QualityInsights {
  let inspected = 0;
  let passed = 0;
  let pendingRework = 0;
  let rejected = 0;
  for (const order of qcOrders) {
    const summary = getQcQuantitySummary(order, qcEntries, qcReworks);
    inspected += summary.inspected;
    passed += summary.passed;
    pendingRework += summary.pendingRework;
    rejected += summary.rejected;
  }
  return {
    inspected,
    passed,
    pendingRework,
    rejected,
    passRate: inspected > 0 ? Math.round((passed / inspected) * 1000) / 10 : 0,
    onHoldOrders: qcOrders.filter((o) => o.status === "on_hold"),
  };
}

/** Quantity of rejected/rework pieces grouped by defect reason, across inspection entries and rework resolutions. */
export function getDefectReasonBreakdown(qcEntries: QcInspectionEntry[], qcReworks: QcRework[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const entry of qcEntries) {
    if (!entry.defectReasonId) continue;
    const qty = entry.reworkQuantity + entry.rejectedQuantity;
    if (qty <= 0) continue;
    totals[entry.defectReasonId] = (totals[entry.defectReasonId] ?? 0) + qty;
  }
  for (const rework of qcReworks) {
    const rejected = rework.rejectedQuantity ?? 0;
    if (rejected <= 0) continue;
    totals[rework.reasonId] = (totals[rework.reasonId] ?? 0) + rejected;
  }
  return totals;
}

// ---------------------------------------------------------------------------
// Fulfillment insights — Packing / Finished Goods / Dispatch, for Management + Reports.
// ---------------------------------------------------------------------------

export interface FulfillmentInsights {
  readyForPacking: number;
  packingInProgress: number;
  packed: number;
  finishedGoodsAvailable: number;
  recentlyDispatchedQty: number;
}

export function getFulfillmentInsights(
  packingOrders: PackingOrder[],
  fgBalances: FinishedGoodsBalance[],
  dispatchOrders: DispatchOrder[],
  readyForPackingCount: number,
  today: string,
): FulfillmentInsights {
  const packingInProgress = packingOrders.filter((p) => p.status === "in_progress" || p.status === "partially_packed").length;
  const packed = packingOrders.filter((p) => p.status === "packed").length;
  const finishedGoodsAvailable = fgBalances.reduce((sum, b) => sum + getFinishedGoodsAvailable(b), 0);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentlyDispatchedQty = dispatchOrders
    .filter((d) => d.status !== "cancelled" && new Date(d.dispatchDate) >= sevenDaysAgo)
    .reduce((sum, d) => sum + d.quantity, 0);

  return { readyForPacking: readyForPackingCount, packingInProgress, packed, finishedGoodsAvailable, recentlyDispatchedQty };
}
