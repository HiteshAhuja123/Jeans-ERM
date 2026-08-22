import type { ApprovalItem, PurchaseOrder, PurchaseRequest } from "@/types";

/**
 * Real pending-approval items, derived from live Purchase Request / Purchase Order data — not a
 * separate stored queue. Only record types with a genuine "pending_approval" status and a real
 * approve/reject transition are surfaced here (see `getNextPrStatusOptions`/`getNextPoStatusOptions`
 * in `purchasing-utils.ts`), so Approve/Reject always maps to an existing, working status change.
 */
export function getPendingApprovals(purchaseRequests: PurchaseRequest[], purchaseOrders: PurchaseOrder[]): ApprovalItem[] {
  const fromRequests: ApprovalItem[] = purchaseRequests
    .filter((pr) => pr.status === "pending_approval")
    .map((pr) => ({
      id: `pr-approval-${pr.id}`,
      type: "Purchase Request",
      title: `${pr.requestNumber} — ${pr.materialName}`,
      requestedBy: pr.requestedBy,
      timestamp: pr.requestDate,
      recordType: "purchase_request",
      recordId: pr.id,
      href: `/purchasing/requests/${pr.id}`,
    }));

  const fromOrders: ApprovalItem[] = purchaseOrders
    .filter((po) => po.status === "pending_approval")
    .map((po) => ({
      id: `po-approval-${po.id}`,
      type: "Purchase Order",
      title: `${po.poNumber} — ${po.supplierName}`,
      requestedBy: "Purchasing",
      amount: po.totalValue,
      timestamp: po.orderDate,
      recordType: "purchase_order",
      recordId: po.id,
      href: `/purchasing/orders/${po.id}`,
    }));

  return [...fromRequests, ...fromOrders].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
