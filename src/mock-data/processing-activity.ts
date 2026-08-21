import type { ProcessingOrder, ProcessingTransaction } from "@/types";

export interface ProcessingActivityEntry {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
}

/** Built from the actual Processing Order / Transaction records, mirrors `buildSewingOrderActivity`. */
export function buildProcessingOrderActivity(order: ProcessingOrder, transactions: ProcessingTransaction[]): ProcessingActivityEntry[] {
  const result: ProcessingActivityEntry[] = [];

  result.push({ id: `${order.id}-created`, actor: "Anjali Mehta", action: `Processing order created for ${order.sewingOrderNumber} — ${order.processingTypeName}`, timestamp: order.createdDate });

  const orderTransactions = transactions.filter((t) => t.processingOrderId === order.id);
  for (const tx of orderTransactions) {
    result.push({
      id: `${order.id}-tx-${tx.id}`,
      actor: tx.recordedBy,
      action:
        tx.type === "sent"
          ? `${tx.quantity.toLocaleString()} pcs sent to ${order.vendorName ?? "the floor"}`
          : `${tx.quantity.toLocaleString()} pcs received${tx.issueNotes ? ` — ${tx.issueNotes}` : ""}`,
      timestamp: tx.recordedDate,
    });
  }

  if (order.status === "on_hold" && order.holdReason) {
    result.push({ id: `${order.id}-hold`, actor: "Anjali Mehta", action: `Processing put on hold — ${order.holdReason}`, timestamp: order.actualStart ?? order.createdDate });
  }

  if (order.status === "completed" && order.actualEnd) {
    result.push({ id: `${order.id}-completed`, actor: "Anjali Mehta", action: "Processing order completed", timestamp: order.actualEnd });
  }

  if (order.status === "cancelled") {
    result.push({ id: `${order.id}-cancelled`, actor: "Anjali Mehta", action: "Processing order cancelled", timestamp: order.createdDate });
  }

  return result.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
