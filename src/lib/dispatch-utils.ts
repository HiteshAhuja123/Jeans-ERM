import type { DispatchOrder, DispatchOrderStatus, FinishedGoodsBalance, Order } from "@/types";
import { getFinishedGoodsAvailable } from "@/lib/finished-goods-utils";

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

export function generateDispatchOrderNumber(existing: Array<{ dispatchOrderNumber: string }>, year = new Date().getFullYear()): string {
  return nextSequenceNumber(existing.map((o) => o.dispatchOrderNumber), `DISP-${year}-`, 5);
}

// ---------------------------------------------------------------------------
// Finished Goods -> Dispatch
// ---------------------------------------------------------------------------

const activeDispatchStatuses: DispatchOrderStatus[] = ["dispatched", "in_transit", "delivered"];

export function isDispatchOrderActive(status: DispatchOrderStatus): boolean {
  return activeDispatchStatuses.includes(status);
}

/** Quantity of one Finished Goods balance already committed to non-cancelled Dispatch Orders. */
export function getBalanceDispatchCommitted(productionOrderId: string, dispatchOrders: DispatchOrder[]): number {
  return dispatchOrders
    .filter((d) => isDispatchOrderActive(d.status))
    .flatMap((d) => d.lineItems)
    .filter((li) => li.productionOrderId === productionOrderId)
    .reduce((sum, li) => sum + li.quantity, 0);
}

export interface OrderFulfillmentSummary {
  orderedQty: number;
  packedQty: number;
  availableQty: number;
  dispatchedQty: number;
  remainingQty: number;
  stage: "awaiting_stock" | "ready_for_dispatch" | "partially_dispatched" | "dispatched";
}

/**
 * The order-level fulfillment picture — always computed live from Finished Goods balances, whose
 * `packed`/`dispatched` totals are themselves kept in sync by Packing and Dispatch. Never stored.
 */
export function getOrderFulfillmentSummary(order: Pick<Order, "id" | "quantity">, fgBalances: FinishedGoodsBalance[]): OrderFulfillmentSummary {
  const orderBalances = fgBalances.filter((b) => b.orderId === order.id);
  const packedQty = orderBalances.reduce((sum, b) => sum + b.packed, 0);
  const availableQty = orderBalances.reduce((sum, b) => sum + getFinishedGoodsAvailable(b), 0);
  const dispatchedQty = orderBalances.reduce((sum, b) => sum + b.dispatched, 0);
  const remainingQty = Math.max(0, order.quantity - dispatchedQty);

  let stage: OrderFulfillmentSummary["stage"] = "awaiting_stock";
  if (dispatchedQty > 0 && remainingQty === 0) stage = "dispatched";
  else if (dispatchedQty > 0) stage = "partially_dispatched";
  else if (availableQty > 0) stage = "ready_for_dispatch";

  return { orderedQty: order.quantity, packedQty, availableQty, dispatchedQty, remainingQty, stage };
}

export interface DispatchLineValidation {
  valid: boolean;
  message?: string;
}

export function validateDispatchLineQuantity(quantity: number, available: number): DispatchLineValidation {
  if (quantity < 0) return { valid: false, message: "Quantity cannot be negative" };
  if (quantity > available) {
    return { valid: false, message: `Only ${available.toLocaleString()} pieces are available to dispatch` };
  }
  return { valid: true };
}

export function getNextDispatchOrderStatusOptions(status: DispatchOrderStatus): DispatchOrderStatus[] {
  switch (status) {
    case "dispatched":
      return ["in_transit", "cancelled"];
    case "in_transit":
      return ["delivered", "cancelled"];
    case "delivered":
    case "cancelled":
      return [];
  }
}
