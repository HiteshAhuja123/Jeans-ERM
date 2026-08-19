import type { ProductionOrder, ProductionActivityEntry } from "@/types";

const releasedStatuses: ProductionOrder["status"][] = ["released", "in_progress", "on_hold", "partially_completed", "completed"];

function offsetDate(base: string, days: number): string {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/** Deterministic activity timeline derived from a production order's current fields. */
export function buildProductionOrderActivity(po: ProductionOrder): ProductionActivityEntry[] {
  const entries: ProductionActivityEntry[] = [];
  let seq = 0;

  function log(daysAfterStart: number, actor: string, action: string) {
    seq += 1;
    entries.push({
      id: `${po.id}-act-${seq}`,
      productionOrderId: po.id,
      actor,
      action,
      timestamp: offsetDate(po.plannedStart, daysAfterStart),
    });
  }

  log(-3, "Rakesh Verma", `Production order created for ${po.orderNumber}`);
  log(-2, "Rakesh Verma", "Material requirement calculated");

  if (po.productionLineId) {
    log(-2, po.supervisor ?? "Rakesh Verma", "Production line assigned");
  }

  if (releasedStatuses.includes(po.status)) {
    log(-1, "Rakesh Verma", "Production order released");
  }

  if (po.status === "in_progress" || po.status === "partially_completed" || po.status === "completed") {
    log(0, po.supervisor ?? "Production Team", "Production started");
  }

  if (po.status === "on_hold") {
    log(1, po.supervisor ?? "Production Team", "Production order put on hold");
  }

  if (po.status === "partially_completed") {
    log(
      3,
      po.supervisor ?? "Production Team",
      `Quantity updated — ${po.quantityProduced.toLocaleString()} of ${po.quantity.toLocaleString()} pcs completed`,
    );
  }

  if (po.status === "completed") {
    log(3, po.supervisor ?? "Production Team", "Production order completed");
  }

  if (po.status === "cancelled") {
    log(1, "Rakesh Verma", "Production order cancelled");
  }

  return entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
