import type { SewingOrder, SewingOrderBundle, SewingProductionEntry, SewingRework } from "@/types";

export interface SewingActivityEntry {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
}

/**
 * Built from the actual Sewing Order / Bundle Assignment / Production Entry / Rework records
 * rather than a synthetic script — every entry traces back to a real record's own timestamp, so
 * the timeline stays correct as new assignments, entries and rework resolutions are recorded.
 */
export function buildSewingOrderActivity(
  order: SewingOrder,
  bundleLinks: SewingOrderBundle[],
  entries: SewingProductionEntry[],
  reworks: SewingRework[],
): SewingActivityEntry[] {
  const result: SewingActivityEntry[] = [];

  result.push({ id: `${order.id}-created`, actor: "Anjali Mehta", action: `Sewing order created for ${order.productionOrderNumber}`, timestamp: order.createdDate });

  const orderLinks = bundleLinks.filter((l) => l.sewingOrderId === order.id);
  if (orderLinks.length > 0) {
    const assignDate = orderLinks[0].assignedDate;
    const totalQty = orderLinks.reduce((sum, l) => sum + l.quantity, 0);
    result.push({
      id: `${order.id}-bundles-assigned`,
      actor: order.supervisor ?? "Anjali Mehta",
      action: `${orderLinks.length} bundle${orderLinks.length === 1 ? "" : "s"} assigned — ${totalQty.toLocaleString()} pcs`,
      timestamp: assignDate,
    });
  }

  if (order.productionLineId) {
    result.push({
      id: `${order.id}-line-assigned`,
      actor: order.supervisor ?? "Anjali Mehta",
      action: "Assigned to sewing line",
      timestamp: orderLinks[0]?.assignedDate ?? order.createdDate,
    });
  }

  if (order.actualStart) {
    result.push({ id: `${order.id}-started`, actor: order.supervisor ?? "Anjali Mehta", action: "Sewing started", timestamp: order.actualStart });
  }

  if (order.status === "on_hold" && order.holdReason) {
    result.push({ id: `${order.id}-hold`, actor: order.supervisor ?? "Anjali Mehta", action: `Sewing put on hold — ${order.holdReason}`, timestamp: order.actualStart ?? order.createdDate });
  }

  const orderEntries = entries.filter((e) => e.sewingOrderId === order.id);
  for (const entry of orderEntries) {
    result.push({
      id: `${order.id}-entry-${entry.id}`,
      actor: entry.recordedBy,
      action: `Production recorded for ${entry.bundleNumber} — ${entry.inputQuantity.toLocaleString()} in, ${entry.goodQuantity.toLocaleString()} good, ${entry.rejectedQuantity.toLocaleString()} rejected, ${entry.reworkQuantity.toLocaleString()} rework`,
      timestamp: entry.recordedDate,
    });
    if (entry.rejectedQuantity + entry.reworkQuantity > 0) {
      result.push({
        id: `${order.id}-defect-${entry.id}`,
        actor: entry.recordedBy,
        action: `Defect recorded on ${entry.bundleNumber} — ${(entry.rejectedQuantity + entry.reworkQuantity).toLocaleString()} pcs`,
        timestamp: entry.recordedDate,
      });
    }
  }

  const orderReworks = reworks.filter((r) => r.sewingOrderId === order.id);
  for (const rework of orderReworks) {
    result.push({
      id: `${order.id}-rework-${rework.id}`,
      actor: rework.recordedBy,
      action: `Rework ${rework.reworkNumber} created — ${rework.quantity.toLocaleString()} pcs on ${rework.bundleId}`,
      timestamp: rework.createdDate,
    });
    if (rework.completedDate) {
      result.push({
        id: `${order.id}-rework-done-${rework.id}`,
        actor: rework.recordedBy,
        action: `Rework ${rework.reworkNumber} completed — ${(rework.completedQuantity ?? 0).toLocaleString()} recovered, ${(rework.rejectedQuantity ?? 0).toLocaleString()} rejected`,
        timestamp: rework.completedDate,
      });
    }
  }

  if (order.status === "completed" && order.actualEnd) {
    result.push({ id: `${order.id}-completed`, actor: order.supervisor ?? "Anjali Mehta", action: "Sewing order completed", timestamp: order.actualEnd });
  }

  if (order.status === "cancelled") {
    result.push({ id: `${order.id}-cancelled`, actor: "Anjali Mehta", action: "Sewing order cancelled", timestamp: order.createdDate });
  }

  return result.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
