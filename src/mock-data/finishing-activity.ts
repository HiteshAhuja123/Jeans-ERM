import type { FinishingEntry, FinishingOrder } from "@/types";

export interface FinishingActivityEntry {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
}

/** Built from the actual Finishing Order / Entry records, mirrors `buildSewingOrderActivity`. */
export function buildFinishingOrderActivity(order: FinishingOrder, entries: FinishingEntry[]): FinishingActivityEntry[] {
  const result: FinishingActivityEntry[] = [];

  result.push({ id: `${order.id}-created`, actor: "Anjali Mehta", action: `Finishing order created from ${order.processingOrderNumber}`, timestamp: order.createdDate });

  if (order.actualStart) {
    result.push({ id: `${order.id}-started`, actor: order.responsible ?? "Anjali Mehta", action: "Finishing started", timestamp: order.actualStart });
  }

  const orderEntries = entries.filter((e) => e.finishingOrderId === order.id);
  for (const entry of orderEntries) {
    result.push({
      id: `${order.id}-entry-${entry.id}`,
      actor: entry.recordedBy,
      action: `Output recorded — ${entry.processedQuantity.toLocaleString()} processed, ${entry.outputQuantity.toLocaleString()} good, ${entry.issueQuantity.toLocaleString()} flagged`,
      timestamp: entry.recordedDate,
    });
  }

  if (order.status === "on_hold" && order.holdReason) {
    result.push({ id: `${order.id}-hold`, actor: order.responsible ?? "Anjali Mehta", action: `Finishing put on hold — ${order.holdReason}`, timestamp: order.actualStart ?? order.createdDate });
  }

  if (order.status === "completed" && order.actualEnd) {
    result.push({ id: `${order.id}-completed`, actor: order.responsible ?? "Anjali Mehta", action: "Finishing order completed", timestamp: order.actualEnd });
  }

  if (order.status === "cancelled") {
    result.push({ id: `${order.id}-cancelled`, actor: "Anjali Mehta", action: "Finishing order cancelled", timestamp: order.createdDate });
  }

  return result.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
