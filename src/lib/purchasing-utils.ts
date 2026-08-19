import type {
  GoodsReceipt,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  PurchaseRequest,
  PurchaseRequestStatus,
} from "@/types";

function nextSequenceNumber(existingNumbers: string[], prefix: string, digits: number): string {
  const maxSeq = existingNumbers.reduce((max, number) => {
    if (!number.startsWith(prefix)) return max;
    const seq = Number(number.slice(prefix.length));
    return Number.isFinite(seq) ? Math.max(max, seq) : max;
  }, 0);
  return `${prefix}${String(maxSeq + 1).padStart(digits, "0")}`;
}

export function generatePoNumber(existing: PurchaseOrder[], year = new Date().getFullYear()): string {
  return nextSequenceNumber(
    existing.map((po) => po.poNumber),
    `PO-${year}-`,
    5,
  );
}

export function generatePrNumber(existing: PurchaseRequest[], year = new Date().getFullYear()): string {
  return nextSequenceNumber(
    existing.map((pr) => pr.requestNumber),
    `PR-${year}-`,
    4,
  );
}

export function generateGrnNumber(existing: GoodsReceipt[], year = new Date().getFullYear()): string {
  return nextSequenceNumber(
    existing.map((grn) => grn.grnNumber),
    `GRN-${year}-`,
    4,
  );
}

export function getPendingQuantity(item: Pick<PurchaseOrderItem, "quantity" | "receivedQuantity">): number {
  return Math.max(0, item.quantity - item.receivedQuantity);
}

export function getPoTotals(po: Pick<PurchaseOrder, "items">) {
  const ordered = po.items.reduce((sum, item) => sum + item.quantity, 0);
  const received = po.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
  return { ordered, received, pending: Math.max(0, ordered - received) };
}

export function computePoAmounts(items: Array<Pick<PurchaseOrderItem, "quantity" | "unitPrice">>, discount: number, tax: number) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = Math.max(0, subtotal - discount + tax);
  return { subtotal, total };
}

/** Business rule: Partially Received when 0 < received < ordered; Received when received >= ordered. */
export function derivePoReceivingStatus(po: Pick<PurchaseOrder, "items">): "partially_received" | "received" | null {
  const { ordered, received } = getPoTotals(po);
  if (received <= 0) return null;
  return received >= ordered ? "received" : "partially_received";
}

export function canReceiveAgainstPo(status: PurchaseOrderStatus): boolean {
  return status === "sent" || status === "partially_received";
}

export type PoEditTier = "full" | "limited" | "readonly";

export function getPoEditTier(status: PurchaseOrderStatus): PoEditTier {
  switch (status) {
    case "draft":
      return "full";
    case "pending_approval":
    case "approved":
    case "sent":
    case "partially_received":
      return "limited";
    case "received":
    case "cancelled":
      return "readonly";
  }
}

export function getNextPoStatusOptions(status: PurchaseOrderStatus): PurchaseOrderStatus[] {
  switch (status) {
    case "draft":
      return ["pending_approval", "cancelled"];
    case "pending_approval":
      return ["approved", "cancelled"];
    case "approved":
      return ["sent", "cancelled"];
    case "sent":
      return ["cancelled"];
    case "partially_received":
      return ["cancelled"];
    case "received":
    case "cancelled":
      return [];
  }
}

export function getNextPrStatusOptions(status: PurchaseRequestStatus): PurchaseRequestStatus[] {
  switch (status) {
    case "draft":
      return ["submitted", "cancelled"];
    case "submitted":
      return ["pending_approval", "cancelled"];
    case "pending_approval":
      return ["approved", "rejected", "cancelled"];
    case "approved":
    case "rejected":
    case "converted":
    case "cancelled":
      return [];
  }
}
