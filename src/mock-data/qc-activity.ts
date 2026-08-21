import type { QcInspectionEntry, QcOrder, QcRework } from "@/types";

export interface QcActivityEntry {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
}

/** Built from the actual QC Order / Inspection Entry / Rework records, mirrors `buildSewingOrderActivity`. */
export function buildQcOrderActivity(order: QcOrder, entries: QcInspectionEntry[], reworks: QcRework[]): QcActivityEntry[] {
  const result: QcActivityEntry[] = [];

  result.push({ id: `${order.id}-created`, actor: "Anjali Mehta", action: `QC order created from ${order.finishingOrderNumber}`, timestamp: order.createdDate });

  if (order.actualStart) {
    result.push({ id: `${order.id}-started`, actor: order.inspector ?? "Anjali Mehta", action: "Inspection started", timestamp: order.actualStart });
  }

  const orderEntries = entries.filter((e) => e.qcOrderId === order.id);
  for (const entry of orderEntries) {
    result.push({
      id: `${order.id}-entry-${entry.id}`,
      actor: entry.inspector,
      action: `Inspection recorded — ${entry.inspectedQuantity.toLocaleString()} inspected, ${entry.passedQuantity.toLocaleString()} passed, ${entry.reworkQuantity.toLocaleString()} rework, ${entry.rejectedQuantity.toLocaleString()} rejected`,
      timestamp: entry.recordedDate,
    });
  }

  const orderReworks = reworks.filter((r) => r.qcOrderId === order.id);
  for (const rework of orderReworks) {
    result.push({
      id: `${order.id}-rework-${rework.id}`,
      actor: rework.recordedBy,
      action: `Rework ${rework.reworkNumber} created — ${rework.quantity.toLocaleString()} pcs`,
      timestamp: rework.createdDate,
    });
    if (rework.completedDate) {
      result.push({
        id: `${order.id}-rework-done-${rework.id}`,
        actor: rework.recordedBy,
        action: `Rework ${rework.reworkNumber} completed — ${(rework.completedQuantity ?? 0).toLocaleString()} passed, ${(rework.rejectedQuantity ?? 0).toLocaleString()} rejected`,
        timestamp: rework.completedDate,
      });
    }
  }

  if (order.status === "on_hold" && order.holdReason) {
    result.push({ id: `${order.id}-hold`, actor: order.inspector ?? "Anjali Mehta", action: `Inspection put on hold — ${order.holdReason}`, timestamp: order.actualStart ?? order.createdDate });
  }

  if (order.status === "approved" && order.actualEnd) {
    result.push({ id: `${order.id}-approved`, actor: order.inspector ?? "Anjali Mehta", action: "QC order approved — Ready for Packing", timestamp: order.actualEnd });
  }

  if (order.status === "cancelled") {
    result.push({ id: `${order.id}-cancelled`, actor: "Anjali Mehta", action: "QC order cancelled", timestamp: order.createdDate });
  }

  return result.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
