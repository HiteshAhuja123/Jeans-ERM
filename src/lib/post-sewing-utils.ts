import type {
  FinishingEntry,
  FinishingOrder,
  FinishingOrderStatus,
  ProcessingOrder,
  ProcessingOrderStatus,
  ProcessingTransaction,
  ProductionOrder,
  ProductionStageKey,
  QcInspectionEntry,
  QcOrder,
  QcOrderStatus,
  QcRework,
  QcReworkStatus,
  SewingOrder,
  SewingProductionEntry,
  SewingRework,
} from "@/types";
import { getSewingOrderQuantitySummary } from "@/lib/sewing-utils";

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

export function generateProcessingOrderNumber(existing: Array<{ processingOrderNumber: string }>, year = new Date().getFullYear()): string {
  return nextSequenceNumber(existing.map((o) => o.processingOrderNumber), `PROC-${year}-`, 5);
}

export function generateFinishingOrderNumber(existing: Array<{ finishingOrderNumber: string }>, year = new Date().getFullYear()): string {
  return nextSequenceNumber(existing.map((o) => o.finishingOrderNumber), `FIN-${year}-`, 5);
}

export function generateQcOrderNumber(existing: Array<{ qcOrderNumber: string }>, year = new Date().getFullYear()): string {
  return nextSequenceNumber(existing.map((o) => o.qcOrderNumber), `QC-${year}-`, 5);
}

export function generateQcReworkNumber(existing: Array<{ reworkNumber: string }>, year = new Date().getFullYear()): string {
  return nextSequenceNumber(existing.map((r) => r.reworkNumber), `QREWORK-${year}-`, 4);
}

// ---------------------------------------------------------------------------
// Sewing -> Processing handoff
// ---------------------------------------------------------------------------

const openProcessingStatuses: ProcessingOrderStatus[] = ["planned", "in_progress", "partially_received", "completed"];

/** Good output already committed to a (non-cancelled) Processing Order for this Sewing Order. */
export function getSewingOrderProcessingCommitted(sewingOrderId: string, processingOrders: ProcessingOrder[]): number {
  return processingOrders
    .filter((p) => p.sewingOrderId === sewingOrderId && openProcessingStatuses.includes(p.status))
    .reduce((sum, p) => sum + p.quantity, 0);
}

/** Remaining good output from this Sewing Order still available to send into Processing. */
export function getSewingOrderAvailableForProcessing(
  sewingOrder: SewingOrder,
  sewingEntries: SewingProductionEntry[],
  sewingReworks: SewingRework[],
  processingOrders: ProcessingOrder[],
): number {
  const summary = getSewingOrderQuantitySummary(sewingOrder, sewingEntries, sewingReworks);
  if (summary.pendingRework > 0) return 0;
  const committed = getSewingOrderProcessingCommitted(sewingOrder.id, processingOrders);
  return Math.max(0, summary.goodOutput - committed);
}

// ---------------------------------------------------------------------------
// Processing — sent / received / pending
// ---------------------------------------------------------------------------

export function getProcessingOrderTransactions(processingOrderId: string, transactions: ProcessingTransaction[]): ProcessingTransaction[] {
  return transactions.filter((t) => t.processingOrderId === processingOrderId);
}

export function getProcessingSentQuantity(processingOrderId: string, transactions: ProcessingTransaction[]): number {
  return getProcessingOrderTransactions(processingOrderId, transactions)
    .filter((t) => t.type === "sent")
    .reduce((sum, t) => sum + t.quantity, 0);
}

export function getProcessingReceivedQuantity(processingOrderId: string, transactions: ProcessingTransaction[]): number {
  return getProcessingOrderTransactions(processingOrderId, transactions)
    .filter((t) => t.type === "received")
    .reduce((sum, t) => sum + t.quantity, 0);
}

export interface ProcessingQuantitySummary {
  planned: number;
  sent: number;
  received: number;
  /** Sent but not yet received (out at vendor / on the processing floor). */
  inProcess: number;
  /** Not yet completed against the planned quantity. */
  pending: number;
}

export function getProcessingQuantitySummary(order: Pick<ProcessingOrder, "id" | "quantity" | "mode">, transactions: ProcessingTransaction[]): ProcessingQuantitySummary {
  const sent = order.mode === "outsourced" ? getProcessingSentQuantity(order.id, transactions) : order.quantity;
  const received = getProcessingReceivedQuantity(order.id, transactions);
  return {
    planned: order.quantity,
    sent,
    received,
    inProcess: Math.max(0, sent - received),
    pending: Math.max(0, order.quantity - received),
  };
}

/** Max quantity that can be sent right now (outsourced only) — never more than the plan. */
export function getProcessingSendableQuantity(order: Pick<ProcessingOrder, "id" | "quantity">, transactions: ProcessingTransaction[]): number {
  return Math.max(0, order.quantity - getProcessingSentQuantity(order.id, transactions));
}

/** Max quantity that can be received right now — capped by what was sent (outsourced) or the plan (internal). */
export function getProcessingReceivableQuantity(order: Pick<ProcessingOrder, "id" | "quantity" | "mode">, transactions: ProcessingTransaction[]): number {
  const summary = getProcessingQuantitySummary(order, transactions);
  const ceiling = order.mode === "outsourced" ? summary.sent : summary.planned;
  return Math.max(0, ceiling - summary.received);
}

export function deriveProcessingOrderStatus(currentStatus: ProcessingOrderStatus, summary: ProcessingQuantitySummary): ProcessingOrderStatus {
  if (currentStatus === "cancelled" || currentStatus === "on_hold") return currentStatus;
  if (summary.received >= summary.planned && summary.planned > 0) return "completed";
  if (summary.received > 0) return "partially_received";
  if (summary.sent > 0) return "in_progress";
  return currentStatus;
}

export type ProcessingOrderEditTier = "full" | "limited" | "readonly";

export function getProcessingOrderEditTier(status: ProcessingOrderStatus): ProcessingOrderEditTier {
  switch (status) {
    case "planned":
      return "full";
    case "in_progress":
    case "partially_received":
    case "on_hold":
      return "limited";
    case "completed":
    case "cancelled":
      return "readonly";
  }
}

export function getNextProcessingOrderStatusOptions(status: ProcessingOrderStatus): ProcessingOrderStatus[] {
  switch (status) {
    case "planned":
      return ["cancelled"];
    case "in_progress":
      return ["cancelled"];
    case "partially_received":
      return ["cancelled"];
    case "on_hold":
    case "completed":
    case "cancelled":
      return [];
  }
}

// ---------------------------------------------------------------------------
// Processing -> Finishing handoff
// ---------------------------------------------------------------------------

const openFinishingStatuses: FinishingOrderStatus[] = ["planned", "in_progress", "partially_completed", "completed"];

export function getProcessingOrderFinishingCommitted(processingOrderId: string, finishingOrders: FinishingOrder[]): number {
  return finishingOrders
    .filter((f) => f.processingOrderId === processingOrderId && openFinishingStatuses.includes(f.status))
    .reduce((sum, f) => sum + f.quantity, 0);
}

export function getProcessingOrderAvailableForFinishing(
  processingOrder: ProcessingOrder,
  transactions: ProcessingTransaction[],
  finishingOrders: FinishingOrder[],
): number {
  const received = getProcessingReceivedQuantity(processingOrder.id, transactions);
  const committed = getProcessingOrderFinishingCommitted(processingOrder.id, finishingOrders);
  return Math.max(0, received - committed);
}

// ---------------------------------------------------------------------------
// Finishing — processed = output + issue
// ---------------------------------------------------------------------------

export function getFinishingOrderEntries(finishingOrderId: string, entries: FinishingEntry[]): FinishingEntry[] {
  return entries.filter((e) => e.finishingOrderId === finishingOrderId);
}

export function getFinishingOrderProcessedQuantity(finishingOrderId: string, entries: FinishingEntry[]): number {
  return getFinishingOrderEntries(finishingOrderId, entries).reduce((sum, e) => sum + e.processedQuantity, 0);
}

export function getFinishingOrderOutputQuantity(finishingOrderId: string, entries: FinishingEntry[]): number {
  return getFinishingOrderEntries(finishingOrderId, entries).reduce((sum, e) => sum + e.outputQuantity, 0);
}

export function getFinishingOrderIssueQuantity(finishingOrderId: string, entries: FinishingEntry[]): number {
  return getFinishingOrderEntries(finishingOrderId, entries).reduce((sum, e) => sum + e.issueQuantity, 0);
}

export interface FinishingQuantitySummary {
  planned: number;
  processed: number;
  output: number;
  issue: number;
  remaining: number;
}

export function getFinishingOrderQuantitySummary(order: Pick<FinishingOrder, "id" | "quantity">, entries: FinishingEntry[]): FinishingQuantitySummary {
  const processed = getFinishingOrderProcessedQuantity(order.id, entries);
  return {
    planned: order.quantity,
    processed,
    output: getFinishingOrderOutputQuantity(order.id, entries),
    issue: getFinishingOrderIssueQuantity(order.id, entries),
    remaining: Math.max(0, order.quantity - processed),
  };
}

export function deriveFinishingOrderStatus(currentStatus: FinishingOrderStatus, summary: FinishingQuantitySummary): FinishingOrderStatus {
  if (currentStatus === "cancelled" || currentStatus === "on_hold") return currentStatus;
  if (summary.planned > 0 && summary.processed >= summary.planned) return "completed";
  if (summary.processed > 0) return "partially_completed";
  return currentStatus;
}

export type FinishingOrderEditTier = "full" | "limited" | "readonly";

export function getFinishingOrderEditTier(status: FinishingOrderStatus): FinishingOrderEditTier {
  switch (status) {
    case "planned":
      return "full";
    case "in_progress":
    case "partially_completed":
    case "on_hold":
      return "limited";
    case "completed":
    case "cancelled":
      return "readonly";
  }
}

export function getNextFinishingOrderStatusOptions(status: FinishingOrderStatus): FinishingOrderStatus[] {
  switch (status) {
    case "planned":
    case "in_progress":
    case "partially_completed":
    case "on_hold":
      return ["cancelled"];
    case "completed":
    case "cancelled":
      return [];
  }
}

// ---------------------------------------------------------------------------
// Finishing -> QC handoff
// ---------------------------------------------------------------------------

const openQcStatuses: QcOrderStatus[] = ["planned", "in_progress", "on_hold", "partially_completed", "pending_approval", "approved"];

export function getFinishingOrderQcCommitted(finishingOrderId: string, qcOrders: QcOrder[]): number {
  return qcOrders.filter((q) => q.finishingOrderId === finishingOrderId && openQcStatuses.includes(q.status)).reduce((sum, q) => sum + q.quantity, 0);
}

export function getFinishingOrderAvailableForQc(finishingOrder: FinishingOrder, finishingEntries: FinishingEntry[], qcOrders: QcOrder[]): number {
  const output = getFinishingOrderOutputQuantity(finishingOrder.id, finishingEntries);
  const committed = getFinishingOrderQcCommitted(finishingOrder.id, qcOrders);
  return Math.max(0, output - committed);
}

// ---------------------------------------------------------------------------
// QC — inspected = passed + rework + rejected, rework resolution mirrors Sewing.
// ---------------------------------------------------------------------------

export function getQcOrderEntries(qcOrderId: string, entries: QcInspectionEntry[]): QcInspectionEntry[] {
  return entries.filter((e) => e.qcOrderId === qcOrderId);
}

export function getQcOrderInspectedQuantity(qcOrderId: string, entries: QcInspectionEntry[]): number {
  return getQcOrderEntries(qcOrderId, entries).reduce((sum, e) => sum + e.inspectedQuantity, 0);
}

export function getQcOrderEntryPassed(qcOrderId: string, entries: QcInspectionEntry[]): number {
  return getQcOrderEntries(qcOrderId, entries).reduce((sum, e) => sum + e.passedQuantity, 0);
}

export function getQcOrderEntryRejected(qcOrderId: string, entries: QcInspectionEntry[]): number {
  return getQcOrderEntries(qcOrderId, entries).reduce((sum, e) => sum + e.rejectedQuantity, 0);
}

export function getQcOrderEntryRework(qcOrderId: string, entries: QcInspectionEntry[]): number {
  return getQcOrderEntries(qcOrderId, entries).reduce((sum, e) => sum + e.reworkQuantity, 0);
}

export function getQcOrderReworks(qcOrderId: string, reworks: QcRework[]): QcRework[] {
  return reworks.filter((r) => r.qcOrderId === qcOrderId);
}

const openQcReworkStatuses: QcReworkStatus[] = ["pending", "in_progress"];

export function getQcPendingReworkQuantity(qcOrderId: string, reworks: QcRework[]): number {
  return getQcOrderReworks(qcOrderId, reworks)
    .filter((r) => openQcReworkStatuses.includes(r.status))
    .reduce((sum, r) => sum + r.quantity, 0);
}

export function getQcReworkRecoveredQuantity(qcOrderId: string, reworks: QcRework[]): number {
  return getQcOrderReworks(qcOrderId, reworks).reduce((sum, r) => sum + (r.completedQuantity ?? 0), 0);
}

export function getQcReworkRejectedQuantity(qcOrderId: string, reworks: QcRework[]): number {
  return getQcOrderReworks(qcOrderId, reworks).reduce((sum, r) => sum + (r.rejectedQuantity ?? 0), 0);
}

export interface QcQuantitySummary {
  planned: number;
  inspected: number;
  /** Final Passed = entry-level passed + pieces recovered through rework. Never double-counted. */
  passed: number;
  /** Final Rejected = entry-level rejected + pieces rejected out of rework. */
  rejected: number;
  pendingRework: number;
  totalRework: number;
  remaining: number;
}

export function getQcQuantitySummary(order: Pick<QcOrder, "id" | "quantity">, entries: QcInspectionEntry[], reworks: QcRework[]): QcQuantitySummary {
  const inspected = getQcOrderInspectedQuantity(order.id, entries);
  const entryPassed = getQcOrderEntryPassed(order.id, entries);
  const entryRejected = getQcOrderEntryRejected(order.id, entries);
  const totalRework = getQcOrderEntryRework(order.id, entries);
  const recovered = getQcReworkRecoveredQuantity(order.id, reworks);
  const reworkRejected = getQcReworkRejectedQuantity(order.id, reworks);
  const pendingRework = getQcPendingReworkQuantity(order.id, reworks);
  return {
    planned: order.quantity,
    inspected,
    passed: entryPassed + recovered,
    rejected: entryRejected + reworkRejected,
    pendingRework,
    totalRework,
    remaining: Math.max(0, order.quantity - inspected),
  };
}

export interface QcEntryValidation {
  valid: boolean;
  message?: string;
}

export function validateQcInspectionEntry(inspected: number, passed: number, rework: number, rejected: number, maxInspect: number): QcEntryValidation {
  if (maxInspect <= 0) return { valid: false, message: "This finishing output has already been fully inspected." };
  if (!(inspected > 0)) return { valid: false, message: "Enter an inspected quantity greater than 0" };
  if (passed < 0 || rework < 0 || rejected < 0) return { valid: false, message: "Quantities cannot be negative" };
  if (inspected > maxInspect) {
    return { valid: false, message: `Only ${maxInspect.toLocaleString()} pieces are available to inspect` };
  }
  if (passed + rework + rejected !== inspected) {
    return {
      valid: false,
      message: `Passed + Rework + Rejected must total the inspected quantity (${inspected.toLocaleString()}) — currently ${(passed + rework + rejected).toLocaleString()}`,
    };
  }
  return { valid: true };
}

/**
 * QC Order status lifecycle. "Approved" (all inspected, no rework pending) is the terminal,
 * Ready-for-Packing state — automatically derived, never set through a status menu.
 */
export function deriveQcOrderStatus(currentStatus: QcOrderStatus, summary: QcQuantitySummary): QcOrderStatus {
  if (currentStatus === "cancelled" || currentStatus === "on_hold") return currentStatus;
  const inspectionComplete = summary.planned > 0 && summary.inspected >= summary.planned;
  if (!inspectionComplete) {
    if (currentStatus === "partially_completed") return currentStatus;
    return summary.inspected > 0 ? "in_progress" : currentStatus;
  }
  return summary.pendingRework > 0 ? "pending_approval" : "approved";
}

export type QcOrderEditTier = "full" | "limited" | "readonly";

export function getQcOrderEditTier(status: QcOrderStatus): QcOrderEditTier {
  switch (status) {
    case "planned":
      return "full";
    case "in_progress":
    case "on_hold":
    case "partially_completed":
    case "pending_approval":
      return "limited";
    case "approved":
    case "cancelled":
      return "readonly";
  }
}

export function getNextQcOrderStatusOptions(status: QcOrderStatus): QcOrderStatus[] {
  switch (status) {
    case "planned":
    case "in_progress":
    case "partially_completed":
    case "pending_approval":
      return ["cancelled"];
    case "on_hold":
    case "approved":
    case "cancelled":
      return [];
  }
}

// ---------------------------------------------------------------------------
// Production Order progress — "meaningful progress" across the post-sewing chain.
// Never regresses a stage and never marks Ready for Packing prematurely.
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
 * Each of these is called by exactly one stage's service, right after it mutates its own order
 * list — never cross-imported between processing/finishing/qc services (that would create an
 * import cycle). Each only needs its own stage's order list because the guard is purely
 * index-based: a stage only ever pushes `currentStage` forward, never backward, so an earlier
 * stage's mutation is automatically a no-op once a later stage has already started. Returns null
 * when there's nothing to patch (`ProductionOrder.currentStage`/`quantityProduced` are left as-is).
 */
export function syncStageOnProcessing(
  productionOrder: Pick<ProductionOrder, "currentStage">,
  processingOrders: ProcessingOrder[],
): ProductionOrderStageSync | null {
  if (stageIndex(productionOrder.currentStage) >= stageIndex("washing")) return null;
  const active = processingOrders.filter((p) => p.status !== "cancelled");
  if (active.length === 0) return null;
  return { currentStage: "washing", quantityProduced: active.reduce((sum, p) => sum + p.quantity, 0) };
}

export function syncStageOnFinishing(
  productionOrder: Pick<ProductionOrder, "currentStage">,
  finishingOrders: FinishingOrder[],
): ProductionOrderStageSync | null {
  if (stageIndex(productionOrder.currentStage) >= stageIndex("finishing")) return null;
  const active = finishingOrders.filter((f) => f.status !== "cancelled");
  if (active.length === 0) return null;
  return { currentStage: "finishing", quantityProduced: active.reduce((sum, f) => sum + f.quantity, 0) };
}

/**
 * Reaching "packing" here means Ready for Packing (every QC order for this Production Order is
 * Approved) — not that packing has started (Phase 10 owns that).
 */
export function syncStageOnQc(productionOrder: Pick<ProductionOrder, "currentStage">, qcOrders: QcOrder[]): ProductionOrderStageSync | null {
  const active = qcOrders.filter((q) => q.status !== "cancelled");
  if (active.length === 0) return null;
  const allApproved = active.every((q) => q.status === "approved");
  const targetStage: ProductionStageKey = allApproved ? "packing" : "qc";
  if (stageIndex(productionOrder.currentStage) >= stageIndex(targetStage)) return null;
  return { currentStage: targetStage, quantityProduced: active.reduce((sum, q) => sum + q.quantity, 0) };
}
