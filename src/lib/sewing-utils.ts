import type {
  Bundle,
  BundleStatus,
  ProductionLine,
  SewingOrder,
  SewingOrderBundle,
  SewingOrderStatus,
  SewingProductionEntry,
  SewingRework,
  SewingReworkStatus,
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

export function generateSewingOrderNumber(existing: Array<{ sewingOrderNumber: string }>, year = new Date().getFullYear()): string {
  return nextSequenceNumber(existing.map((s) => s.sewingOrderNumber), `SEW-${year}-`, 5);
}

export function generateReworkNumber(existing: Array<{ reworkNumber: string }>, year = new Date().getFullYear()): string {
  return nextSequenceNumber(existing.map((r) => r.reworkNumber), `REWORK-${year}-`, 4);
}

// ---------------------------------------------------------------------------
// Bundle assignment
// ---------------------------------------------------------------------------

const assignableBundleStatuses: BundleStatus[] = ["ready_for_sewing"];

/** Bundles verified and waiting — eligible to be assigned to a sewing order for this production order. */
export function getAssignableBundles(productionOrderId: string, bundles: Bundle[]): Bundle[] {
  return bundles.filter((b) => b.productionOrderId === productionOrderId && assignableBundleStatuses.includes(b.status));
}

export function getSewingOrderBundleLinks(sewingOrderId: string, links: SewingOrderBundle[]): SewingOrderBundle[] {
  return links.filter((l) => l.sewingOrderId === sewingOrderId);
}

export function getSewingOrderBundles(sewingOrderId: string, links: SewingOrderBundle[], bundles: Bundle[]): Bundle[] {
  const bundleIds = new Set(getSewingOrderBundleLinks(sewingOrderId, links).map((l) => l.bundleId));
  return bundles.filter((b) => bundleIds.has(b.id));
}

// ---------------------------------------------------------------------------
// Production entry quantities — Input = Good + Rejected + Rework, always.
// ---------------------------------------------------------------------------

export function getBundleProcessedQuantity(bundleId: string, entries: SewingProductionEntry[]): number {
  return entries.filter((e) => e.bundleId === bundleId).reduce((sum, e) => sum + e.inputQuantity, 0);
}

/** Remaining = Bundle Quantity - Already Processed. Never negative — the hard cap on new entries (Sewing Input Validation). */
export function getBundleRemainingQuantity(bundle: Pick<Bundle, "id" | "quantity">, entries: SewingProductionEntry[]): number {
  return Math.max(0, bundle.quantity - getBundleProcessedQuantity(bundle.id, entries));
}

export function isBundleFullyProcessed(bundle: Pick<Bundle, "id" | "quantity">, entries: SewingProductionEntry[]): boolean {
  return bundle.quantity > 0 && getBundleRemainingQuantity(bundle, entries) <= 0;
}

export function getSewingOrderInputQuantity(sewingOrderId: string, entries: SewingProductionEntry[]): number {
  return entries.filter((e) => e.sewingOrderId === sewingOrderId).reduce((sum, e) => sum + e.inputQuantity, 0);
}

export function getSewingOrderEntryGood(sewingOrderId: string, entries: SewingProductionEntry[]): number {
  return entries.filter((e) => e.sewingOrderId === sewingOrderId).reduce((sum, e) => sum + e.goodQuantity, 0);
}

export function getSewingOrderEntryRejected(sewingOrderId: string, entries: SewingProductionEntry[]): number {
  return entries.filter((e) => e.sewingOrderId === sewingOrderId).reduce((sum, e) => sum + e.rejectedQuantity, 0);
}

export function getSewingOrderEntryRework(sewingOrderId: string, entries: SewingProductionEntry[]): number {
  return entries.filter((e) => e.sewingOrderId === sewingOrderId).reduce((sum, e) => sum + e.reworkQuantity, 0);
}

// ---------------------------------------------------------------------------
// Rework resolution — "do not count the same garment twice in good production."
// ---------------------------------------------------------------------------

export function getSewingOrderReworks(sewingOrderId: string, reworks: SewingRework[]): SewingRework[] {
  return reworks.filter((r) => r.sewingOrderId === sewingOrderId);
}

const openReworkStatuses: SewingReworkStatus[] = ["pending", "in_progress"];

/** Rework raised but not yet resolved to a good/rejected split — the "Pending Rework" figure. */
export function getPendingReworkQuantity(sewingOrderId: string, reworks: SewingRework[]): number {
  return getSewingOrderReworks(sewingOrderId, reworks)
    .filter((r) => openReworkStatuses.includes(r.status))
    .reduce((sum, r) => sum + r.quantity, 0);
}

export function getReworkRecoveredQuantity(sewingOrderId: string, reworks: SewingRework[]): number {
  return getSewingOrderReworks(sewingOrderId, reworks).reduce((sum, r) => sum + (r.completedQuantity ?? 0), 0);
}

export function getReworkRejectedQuantity(sewingOrderId: string, reworks: SewingRework[]): number {
  return getSewingOrderReworks(sewingOrderId, reworks).reduce((sum, r) => sum + (r.rejectedQuantity ?? 0), 0);
}

export interface SewingOrderQuantitySummary {
  planned: number;
  input: number;
  /** Final Good Output = entry-level good + pieces recovered through rework. Never double-counted. */
  goodOutput: number;
  /** Final Rejected = entry-level rejected + pieces rejected out of rework. */
  rejected: number;
  /** Rework raised but not yet resolved. */
  pendingRework: number;
  /** Total rework raised across all entries, resolved or not — drives the Rework % metric. */
  totalRework: number;
  remaining: number;
}

export function getSewingOrderQuantitySummary(
  order: Pick<SewingOrder, "id" | "quantity">,
  entries: SewingProductionEntry[],
  reworks: SewingRework[],
): SewingOrderQuantitySummary {
  const input = getSewingOrderInputQuantity(order.id, entries);
  const entryGood = getSewingOrderEntryGood(order.id, entries);
  const entryRejected = getSewingOrderEntryRejected(order.id, entries);
  const totalRework = getSewingOrderEntryRework(order.id, entries);
  const recovered = getReworkRecoveredQuantity(order.id, reworks);
  const reworkRejected = getReworkRejectedQuantity(order.id, reworks);
  const pendingRework = getPendingReworkQuantity(order.id, reworks);
  return {
    planned: order.quantity,
    input,
    goodOutput: entryGood + recovered,
    rejected: entryRejected + reworkRejected,
    pendingRework,
    totalRework,
    remaining: Math.max(0, order.quantity - input),
  };
}

// ---------------------------------------------------------------------------
// Metrics — kept distinct per "do not confuse metrics."
// ---------------------------------------------------------------------------

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Achievement % = Good Output / Planned Quantity. */
export function getAchievementPercent(goodOutput: number, planned: number): number {
  return planned > 0 ? roundPercent((goodOutput / planned) * 100) : 0;
}

/** Rejection % = Rejected / Input. */
export function getRejectionPercent(rejected: number, input: number): number {
  return input > 0 ? roundPercent((rejected / input) * 100) : 0;
}

/** Rework % = Rework / Input. */
export function getReworkPercent(rework: number, input: number): number {
  return input > 0 ? roundPercent((rework / input) * 100) : 0;
}

// ---------------------------------------------------------------------------
// Quantity validation — the "Input = Good + Rejected + Rework" rule, enforced everywhere it's entered.
// ---------------------------------------------------------------------------

export interface ProductionEntryValidation {
  valid: boolean;
  message?: string;
}

export function validateProductionEntry(input: number, good: number, rejected: number, rework: number, maxInput: number): ProductionEntryValidation {
  if (maxInput <= 0) return { valid: false, message: "This bundle has already been fully processed." };
  if (!(input > 0)) return { valid: false, message: "Enter an input quantity greater than 0" };
  if (good < 0 || rejected < 0 || rework < 0) return { valid: false, message: "Quantities cannot be negative" };
  if (input > maxInput) {
    return { valid: false, message: `Only ${maxInput.toLocaleString()} pieces are available on this bundle` };
  }
  if (good + rejected + rework !== input) {
    return {
      valid: false,
      message: `Good + Rejected + Rework must total the input quantity (${input.toLocaleString()}) — currently ${(good + rejected + rework).toLocaleString()}`,
    };
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// Bundle status lifecycle — driven by processed quantity, never a bare status click.
// ---------------------------------------------------------------------------

/** Status a bundle should carry right after a production entry is recorded against it. */
export function deriveBundleStatusAfterEntry(bundle: Pick<Bundle, "id" | "quantity">, entries: SewingProductionEntry[]): BundleStatus {
  return isBundleFullyProcessed(bundle, entries) ? "completed" : "partially_completed";
}

// ---------------------------------------------------------------------------
// Sewing Order status lifecycle
// ---------------------------------------------------------------------------

export type SewingOrderEditTier = "full" | "limited" | "readonly";

export function getSewingOrderEditTier(status: SewingOrderStatus): SewingOrderEditTier {
  switch (status) {
    case "planned":
    case "assigned":
    case "ready":
      return "full";
    case "in_progress":
    case "on_hold":
    case "partially_completed":
    case "processing_complete":
      return "limited";
    case "completed":
    case "cancelled":
      return "readonly";
  }
}

/**
 * Manual transitions only — "on_hold" is reached through the dedicated Hold action, and
 * "processing_complete"/"completed" are set automatically as production entries come in
 * (see `deriveSewingOrderStatus`), never through this menu. "Partially Completed" is the one
 * status a supervisor sets by hand — a deliberate "pausing here for now" marker, distinct from
 * "On Hold" (blocked by an issue) — mirroring how Cutting Orders/Production Orders work.
 */
export function getNextSewingOrderStatusOptions(status: SewingOrderStatus): SewingOrderStatus[] {
  switch (status) {
    case "planned":
    case "assigned":
    case "ready":
      return ["cancelled"];
    case "in_progress":
      return ["partially_completed", "cancelled"];
    case "partially_completed":
      return ["in_progress", "cancelled"];
    case "processing_complete":
      return ["cancelled"];
    case "on_hold":
      return ["cancelled"];
    case "completed":
    case "cancelled":
      return [];
  }
}

/**
 * "Sewing Processing Complete" (every assigned piece has a production entry) is distinct from
 * "Rework Complete" (no rework left outstanding) — see items 36-38. A Sewing Order only reaches
 * "Completed" once processing is complete AND no rework is still pending/in progress. A manually
 * set "on_hold" or "partially_completed" status is preserved until more entries arrive or
 * processing completes — it is never silently reverted to "in_progress".
 */
export function deriveSewingOrderStatus(currentStatus: SewingOrderStatus, summary: SewingOrderQuantitySummary): SewingOrderStatus {
  if (currentStatus === "cancelled" || currentStatus === "on_hold") return currentStatus;
  const processingComplete = summary.planned > 0 && summary.input >= summary.planned;
  if (!processingComplete) {
    if (currentStatus === "partially_completed") return currentStatus;
    return summary.input > 0 ? "in_progress" : currentStatus;
  }
  return summary.pendingRework > 0 ? "processing_complete" : "completed";
}

// ---------------------------------------------------------------------------
// Readiness for the next phase (Washing/Processing) — a conceptual handoff only, no workflow yet.
// ---------------------------------------------------------------------------

export function isReadyForProcessing(summary: SewingOrderQuantitySummary): boolean {
  return summary.goodOutput > 0 && summary.pendingRework === 0;
}

// ---------------------------------------------------------------------------
// Line capacity — reuses the Phase 3/6 Production Line master, not a duplicate.
// ---------------------------------------------------------------------------

const activeLineSewingStatuses: SewingOrderStatus[] = ["assigned", "ready", "in_progress", "partially_completed", "on_hold", "processing_complete"];

export interface SewingLineSnapshot {
  lineId: string;
  lineName: string;
  dailyCapacity: number;
  assigned: number;
  completed: number;
  remaining: number;
  utilizationPercent: number;
}

/** "Current Assignment" is every active (non-completed, non-cancelled) sewing order's full quantity on that line. */
export function getSewingLineSnapshot(
  line: ProductionLine,
  sewingOrders: SewingOrder[],
  entries: SewingProductionEntry[],
  reworks: SewingRework[],
): SewingLineSnapshot {
  const active = sewingOrders.filter((o) => o.productionLineId === line.id && activeLineSewingStatuses.includes(o.status));
  const assigned = active.reduce((sum, o) => sum + o.quantity, 0);
  const completed = active.reduce((sum, o) => sum + getSewingOrderQuantitySummary(o, entries, reworks).goodOutput, 0);
  const remaining = Math.max(0, assigned - completed);
  const utilizationPercent = line.capacity > 0 ? Math.round((assigned / line.capacity) * 100) : 0;
  return { lineId: line.id, lineName: line.name, dailyCapacity: line.capacity, assigned, completed, remaining, utilizationPercent };
}

export function getLineOverCapacityAmount(snapshot: Pick<SewingLineSnapshot, "assigned" | "dailyCapacity">): number {
  return Math.max(0, snapshot.assigned - snapshot.dailyCapacity);
}

// ---------------------------------------------------------------------------
// Delay risk
// ---------------------------------------------------------------------------

const terminalSewingStatuses: SewingOrderStatus[] = ["completed", "cancelled"];

export function isSewingOrderDelayed(order: Pick<SewingOrder, "plannedEnd" | "status">, today = new Date().toISOString().slice(0, 10)): boolean {
  return Boolean(order.plannedEnd && order.plannedEnd < today && !terminalSewingStatuses.includes(order.status));
}
