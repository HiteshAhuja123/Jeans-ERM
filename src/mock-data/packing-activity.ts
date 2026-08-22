import type { PackingEntry, PackingOrder } from "@/types";

export interface PackingActivityEntry {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
}

/** Built from the actual Packing Order / Entry records, mirrors `buildFinishingOrderActivity`. */
export function buildPackingOrderActivity(order: PackingOrder, entries: PackingEntry[]): PackingActivityEntry[] {
  const result: PackingActivityEntry[] = [];

  result.push({ id: `${order.id}-created`, actor: "Anjali Mehta", action: `Packing order created from ${order.qcOrderNumber}`, timestamp: order.createdDate });

  if (order.actualStart) {
    result.push({ id: `${order.id}-started`, actor: order.responsible ?? "Anjali Mehta", action: "Packing started", timestamp: order.actualStart });
  }

  const orderEntries = entries.filter((e) => e.packingOrderId === order.id);
  for (const entry of orderEntries) {
    result.push({
      id: `${order.id}-entry-${entry.id}`,
      actor: entry.recordedBy,
      action: `Packing recorded — ${entry.packedQuantity.toLocaleString()} pcs into ${entry.cartonCount.toLocaleString()} carton${entry.cartonCount === 1 ? "" : "s"}`,
      timestamp: entry.recordedDate,
    });
  }

  if (order.status === "on_hold" && order.holdReason) {
    result.push({ id: `${order.id}-hold`, actor: order.responsible ?? "Anjali Mehta", action: `Packing put on hold — ${order.holdReason}`, timestamp: order.actualStart ?? order.createdDate });
  }

  if (order.status === "packed" && order.actualEnd) {
    result.push({ id: `${order.id}-packed`, actor: order.responsible ?? "Anjali Mehta", action: "Packing order fully packed", timestamp: order.actualEnd });
  }

  if (order.status === "cancelled") {
    result.push({ id: `${order.id}-cancelled`, actor: "Anjali Mehta", action: "Packing order cancelled", timestamp: order.createdDate });
  }

  return result.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
