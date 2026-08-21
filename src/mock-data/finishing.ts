import type { FinishingEntry, FinishingOrder } from "@/types";

/**
 * Seed Finishing Orders trace back to received Processing Order quantity: fin-001 draws all 700
 * pcs received on proc-001 and is fully finished; fin-002 draws from proc-003's 797 pcs and is
 * still partway through (297 pcs remaining — see item 13-style "Partial Finishing"). proc-002's
 * 300 pcs received so far are deliberately left unclaimed, so the Finishing work queue has
 * something waiting.
 */
export const mockFinishingOrders: FinishingOrder[] = [
  {
    id: "fin-001",
    finishingOrderNumber: "FIN-2026-00001",
    processingOrderId: "proc-001",
    processingOrderNumber: "PROC-2026-00001",
    sewingOrderId: "sew-121",
    productionOrderId: "prod-121",
    productionOrderNumber: "PROD-2026-00121",
    orderId: "ord-012",
    orderNumber: "ORD-2026-00463",
    customerId: "cust-003",
    customerName: "Northline Trading",
    styleId: "style-005",
    styleCode: "BOOT-210",
    styleName: "Bootcut 210",
    colorId: "color-001",
    colorName: "Indigo",
    quantity: 700,
    unit: "pcs",
    responsible: "Kavya Reddy",
    status: "completed",
    plannedStart: "2026-08-15",
    plannedEnd: "2026-08-16",
    actualStart: "2026-08-15T09:00:00",
    actualEnd: "2026-08-16T17:00:00",
    createdDate: "2026-08-14",
  },
  {
    id: "fin-002",
    finishingOrderNumber: "FIN-2026-00002",
    processingOrderId: "proc-003",
    processingOrderNumber: "PROC-2026-00003",
    sewingOrderId: "sew-122",
    productionOrderId: "prod-122",
    productionOrderNumber: "PROD-2026-00122",
    orderId: "ord-001",
    orderNumber: "ORD-2026-00452",
    customerId: "cust-001",
    customerName: "Urban Denim Co.",
    styleId: "style-001",
    styleCode: "SLIM-502",
    styleName: "Slim 502",
    colorId: "color-001",
    colorName: "Indigo",
    quantity: 797,
    unit: "pcs",
    responsible: "Kavya Reddy",
    status: "in_progress",
    plannedStart: "2026-08-20",
    plannedEnd: "2026-08-22",
    actualStart: "2026-08-20T09:00:00",
    createdDate: "2026-08-19",
  },
];

let entrySeq = 0;
function nextEntryId(): string {
  entrySeq += 1;
  return `fne-${String(entrySeq).padStart(3, "0")}`;
}

export const mockFinishingEntries: FinishingEntry[] = [
  {
    id: nextEntryId(),
    finishingOrderId: "fin-001",
    date: "2026-08-16",
    processedQuantity: 700,
    outputQuantity: 680,
    issueQuantity: 20,
    issueReasonId: "fir-002",
    notes: "Stain marks found on 20 pcs during final press.",
    recordedBy: "Kavya Reddy",
    recordedDate: "2026-08-16T17:00:00",
  },
  {
    id: nextEntryId(),
    finishingOrderId: "fin-002",
    date: "2026-08-20",
    processedQuantity: 500,
    outputQuantity: 480,
    issueQuantity: 20,
    issueReasonId: "fir-004",
    notes: "Pressing crease inconsistent on first run.",
    recordedBy: "Kavya Reddy",
    recordedDate: "2026-08-20T17:00:00",
  },
];
