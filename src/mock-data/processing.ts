import type { ProcessingOrder, ProcessingTransaction } from "@/types";

/**
 * Seed Processing Orders trace back to Phase 8's sewing output: sew-121 and sew-122 are the only
 * seed Sewing Orders with fully resolved rework (see `isReadyForProcessing`), so they're the only
 * ones with Processing Orders here. sew-121's 1195 good pcs are split across an internal Stone
 * Wash batch (done) and an outsourced Enzyme Wash batch (still partially received, to exercise
 * the vendor sent/received/pending flow); sew-122's 797 good pcs went through a single internal
 * Stone Wash batch, already completed.
 */
export const mockProcessingOrders: ProcessingOrder[] = [
  {
    id: "proc-001",
    processingOrderNumber: "PROC-2026-00001",
    sewingOrderId: "sew-121",
    sewingOrderNumber: "SEW-2026-00101",
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
    processingTypeId: "pty-001",
    processingTypeName: "Stone Wash",
    quantity: 700,
    unit: "pcs",
    mode: "internal",
    status: "completed",
    plannedStart: "2026-08-13",
    plannedEnd: "2026-08-14",
    actualStart: "2026-08-13T09:00:00",
    actualEnd: "2026-08-14T18:00:00",
    createdDate: "2026-08-13",
  },
  {
    id: "proc-002",
    processingOrderNumber: "PROC-2026-00002",
    sewingOrderId: "sew-121",
    sewingOrderNumber: "SEW-2026-00101",
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
    processingTypeId: "pty-002",
    processingTypeName: "Enzyme Wash",
    quantity: 495,
    unit: "pcs",
    mode: "outsourced",
    vendorId: "sup-005",
    vendorName: "Indigo Wash Works",
    status: "partially_received",
    plannedStart: "2026-08-15",
    plannedEnd: "2026-08-20",
    actualStart: "2026-08-16T10:00:00",
    createdDate: "2026-08-14",
    notes: "Vendor reported a 2-day delay on this batch — machine breakdown.",
  },
  {
    id: "proc-003",
    processingOrderNumber: "PROC-2026-00003",
    sewingOrderId: "sew-122",
    sewingOrderNumber: "SEW-2026-00102",
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
    processingTypeId: "pty-001",
    processingTypeName: "Stone Wash",
    quantity: 797,
    unit: "pcs",
    mode: "internal",
    status: "completed",
    plannedStart: "2026-08-18",
    plannedEnd: "2026-08-19",
    actualStart: "2026-08-18T09:00:00",
    actualEnd: "2026-08-19T17:30:00",
    createdDate: "2026-08-18",
  },
];

let txSeq = 0;
function nextTxId(): string {
  txSeq += 1;
  return `ptx-${String(txSeq).padStart(3, "0")}`;
}

export const mockProcessingTransactions: ProcessingTransaction[] = [
  { id: nextTxId(), processingOrderId: "proc-001", type: "received", quantity: 700, date: "2026-08-14", recordedBy: "Anjali Mehta", recordedDate: "2026-08-14T18:00:00" },
  { id: nextTxId(), processingOrderId: "proc-002", type: "sent", quantity: 495, date: "2026-08-16", recordedBy: "Anjali Mehta", recordedDate: "2026-08-16T10:00:00" },
  {
    id: nextTxId(),
    processingOrderId: "proc-002",
    type: "received",
    quantity: 300,
    date: "2026-08-19",
    issueNotes: "Vendor machine breakdown — remaining 195 pcs delayed by ~2 days.",
    recordedBy: "Anjali Mehta",
    recordedDate: "2026-08-19T16:00:00",
  },
  { id: nextTxId(), processingOrderId: "proc-003", type: "received", quantity: 797, date: "2026-08-19", recordedBy: "Anjali Mehta", recordedDate: "2026-08-19T17:30:00" },
];
