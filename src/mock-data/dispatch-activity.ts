import type { DispatchOrder } from "@/types";

export interface DispatchActivityEntry {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
}

/** Built from the actual Dispatch Order record — mirrors `buildPackingOrderActivity`. */
export function buildDispatchOrderActivity(order: DispatchOrder): DispatchActivityEntry[] {
  const result: DispatchActivityEntry[] = [
    {
      id: `${order.id}-created`,
      actor: order.recordedBy,
      action: `Dispatch created — ${order.quantity.toLocaleString()} pcs across ${order.lineItems.length} line item${order.lineItems.length === 1 ? "" : "s"}`,
      timestamp: order.createdDate,
    },
  ];

  if (order.status === "in_transit" || order.status === "delivered") {
    result.push({ id: `${order.id}-in-transit`, actor: order.recordedBy, action: `Marked In Transit${order.carrier ? ` with ${order.carrier}` : ""}`, timestamp: order.dispatchDate });
  }

  if (order.status === "delivered" && order.deliveredDate) {
    result.push({ id: `${order.id}-delivered`, actor: order.recordedBy, action: "Marked Delivered", timestamp: order.deliveredDate });
  }

  if (order.status === "cancelled") {
    result.push({ id: `${order.id}-cancelled`, actor: order.recordedBy, action: "Dispatch cancelled", timestamp: order.createdDate });
  }

  return result.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
