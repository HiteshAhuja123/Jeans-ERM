import type { Order, OrderActivityEntry } from "@/types";

const inProductionStatuses: Order["status"][] = ["in_production", "partially_completed", "completed", "dispatched"];

function offsetDate(base: string, days: number): string {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * Deterministic activity timeline derived from an order's current fields.
 * A stand-in for a real audit log, which arrives in a later phase.
 */
export function buildOrderActivity(order: Order): OrderActivityEntry[] {
  const entries: OrderActivityEntry[] = [];
  let seq = 0;

  function log(daysAfterOrder: number, actor: string, action: string) {
    seq += 1;
    entries.push({
      id: `${order.id}-act-${seq}`,
      orderId: order.id,
      actor,
      action,
      timestamp: offsetDate(order.orderDate, daysAfterOrder),
    });
  }

  log(0, "Rina Shah", "Order created");

  if (order.status !== "draft") {
    log(1, "Rina Shah", "Order confirmed");
  }

  if (inProductionStatuses.includes(order.status)) {
    log(3, "Deepak Patil", "Production started");
  }

  if (order.isDelayed) {
    log(10, "Priya Kulkarni", "Order flagged as delayed — behind schedule");
  }

  if (order.status === "partially_completed") {
    log(
      15,
      "Meena Iyer",
      `Quantity updated — ${order.quantityProduced.toLocaleString()} of ${order.quantity.toLocaleString()} pcs completed`,
    );
  }

  if (order.status === "completed" || order.status === "dispatched") {
    log(20, "Ravi Chandran", "Production completed");
  }

  if (order.status === "dispatched") {
    log(22, "Arjun Nair", "Order dispatched");
  }

  if (order.status === "cancelled") {
    log(5, "Vikram Joshi", "Order cancelled");
  }

  return entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
