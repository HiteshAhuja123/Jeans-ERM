import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import {
  deriveProcessingOrderStatus,
  generateProcessingOrderNumber,
  getProcessingQuantitySummary,
  syncStageOnProcessing,
} from "@/lib/post-sewing-utils";
import { productionOrderService } from "@/features/production/service";
import { mockProcessingOrders, mockProcessingTransactions } from "@/mock-data";
import type { ProcessingMode, ProcessingOrder, ProcessingType, SewingOrder, Supplier } from "@/types";

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const processingOrderService = createMasterDataService<ProcessingOrder>(mockProcessingOrders, "proc");
export const processingOrderHooks = createMasterDataHooks("processing-orders", processingOrderService);

async function syncProductionOrderForProcessing(productionOrderId: string) {
  const po = await productionOrderService.getById(productionOrderId);
  if (!po) return;
  const allProcessing = await processingOrderService.list();
  const patch = syncStageOnProcessing(po, allProcessing.filter((p) => p.productionOrderId === productionOrderId));
  if (patch) await productionOrderService.update(productionOrderId, patch);
}

// ---------------------------------------------------------------------------
// Transactions — sent/received ledger, mirrors Cutting's FabricIssue/MaterialReturn.
// ---------------------------------------------------------------------------

let transactions = [...mockProcessingTransactions];
let txCounter = transactions.length;

export const processingTransactionService = {
  list: () => delay([...transactions]),
  listByProcessingOrder: (processingOrderId: string) => delay(transactions.filter((t) => t.processingOrderId === processingOrderId)),
};

export const processingTransactionHooks = {
  useList: () => useQuery({ queryKey: ["processing-transactions"], queryFn: processingTransactionService.list }),
  useByProcessingOrder: (processingOrderId: string | undefined) =>
    useQuery({
      queryKey: ["processing-transactions", "processing-order", processingOrderId],
      queryFn: () => processingTransactionService.listByProcessingOrder(processingOrderId as string),
      enabled: Boolean(processingOrderId),
    }),
};

// ---------------------------------------------------------------------------
// Create Processing Order
// ---------------------------------------------------------------------------

export interface CreateProcessingOrderInput {
  sewingOrder: SewingOrder;
  processingType: ProcessingType;
  quantity: number;
  mode: ProcessingMode;
  vendor?: Supplier;
  plannedStart?: string;
  plannedEnd?: string;
  notes?: string;
}

async function createProcessingOrder(input: CreateProcessingOrderInput) {
  const existing = await processingOrderService.list();
  const processingOrderNumber = generateProcessingOrderNumber(existing);
  return processingOrderService.create({
    processingOrderNumber,
    sewingOrderId: input.sewingOrder.id,
    sewingOrderNumber: input.sewingOrder.sewingOrderNumber,
    productionOrderId: input.sewingOrder.productionOrderId,
    productionOrderNumber: input.sewingOrder.productionOrderNumber,
    orderId: input.sewingOrder.orderId,
    orderNumber: input.sewingOrder.orderNumber,
    customerId: input.sewingOrder.customerId,
    customerName: input.sewingOrder.customerName,
    styleId: input.sewingOrder.styleId,
    styleCode: input.sewingOrder.styleCode,
    styleName: input.sewingOrder.styleName,
    colorId: input.sewingOrder.colorId,
    colorName: input.sewingOrder.colorName,
    processingTypeId: input.processingType.id,
    processingTypeName: input.processingType.name,
    quantity: input.quantity,
    unit: input.sewingOrder.unit,
    mode: input.mode,
    vendorId: input.mode === "outsourced" ? input.vendor?.id : undefined,
    vendorName: input.mode === "outsourced" ? input.vendor?.name : undefined,
    status: "planned",
    plannedStart: input.plannedStart || undefined,
    plannedEnd: input.plannedEnd || undefined,
    createdDate: new Date().toISOString().slice(0, 10),
    notes: input.notes,
  });
}

// ---------------------------------------------------------------------------
// Start (internal) — no send step, sent = quantity implicitly.
// ---------------------------------------------------------------------------

async function startInternalProcessing(processingOrder: ProcessingOrder) {
  const updated = await processingOrderService.update(processingOrder.id, {
    status: "in_progress",
    actualStart: processingOrder.actualStart ?? new Date().toISOString(),
  });
  await syncProductionOrderForProcessing(processingOrder.productionOrderId);
  return updated;
}

// ---------------------------------------------------------------------------
// Send to vendor (outsourced)
// ---------------------------------------------------------------------------

export interface SendProcessingInput {
  processingOrder: ProcessingOrder;
  quantity: number;
  date: string;
  notes?: string;
  recordedBy: string;
}

async function sendProcessing(input: SendProcessingInput) {
  txCounter += 1;
  const timestamp = new Date().toISOString();
  const transaction = {
    id: `ptx-${txCounter}`,
    processingOrderId: input.processingOrder.id,
    type: "sent" as const,
    quantity: input.quantity,
    date: input.date,
    issueNotes: input.notes,
    recordedBy: input.recordedBy,
    recordedDate: timestamp,
  };
  transactions = [transaction, ...transactions];

  const patch: Partial<Omit<ProcessingOrder, "id">> = { status: "in_progress" };
  if (!input.processingOrder.actualStart) patch.actualStart = timestamp;
  const updated = await processingOrderService.update(input.processingOrder.id, patch);
  return { transaction, processingOrder: updated };
}

// ---------------------------------------------------------------------------
// Record receipt
// ---------------------------------------------------------------------------

export interface RecordProcessingReceiptInput {
  processingOrder: ProcessingOrder;
  quantity: number;
  date: string;
  issueNotes?: string;
  recordedBy: string;
}

async function recordProcessingReceipt(input: RecordProcessingReceiptInput) {
  txCounter += 1;
  const timestamp = new Date().toISOString();
  const transaction = {
    id: `ptx-${txCounter}`,
    processingOrderId: input.processingOrder.id,
    type: "received" as const,
    quantity: input.quantity,
    date: input.date,
    issueNotes: input.issueNotes,
    recordedBy: input.recordedBy,
    recordedDate: timestamp,
  };
  transactions = [transaction, ...transactions];

  const orderTransactions = transactions.filter((t) => t.processingOrderId === input.processingOrder.id);
  const summary = getProcessingQuantitySummary(input.processingOrder, orderTransactions);
  const nextStatus = deriveProcessingOrderStatus(input.processingOrder.status, summary);
  const patch: Partial<Omit<ProcessingOrder, "id">> = { status: nextStatus };
  if (!input.processingOrder.actualStart) patch.actualStart = timestamp;
  if (nextStatus === "completed" && !input.processingOrder.actualEnd) patch.actualEnd = timestamp;
  const processingOrder = await processingOrderService.update(input.processingOrder.id, patch);

  await syncProductionOrderForProcessing(input.processingOrder.productionOrderId);

  return { transaction, processingOrder };
}

// ---------------------------------------------------------------------------
// Hold / resume
// ---------------------------------------------------------------------------

async function holdProcessingOrder({ processingOrder, reason }: { processingOrder: ProcessingOrder; reason: string }) {
  return processingOrderService.update(processingOrder.id, { status: "on_hold", holdReason: reason });
}

async function resumeProcessingOrder(processingOrder: ProcessingOrder) {
  const orderTransactions = transactions.filter((t) => t.processingOrderId === processingOrder.id);
  const summary = getProcessingQuantitySummary(processingOrder, orderTransactions);
  const resumedStatus = summary.received > 0 ? "partially_received" : summary.sent > 0 ? "in_progress" : "planned";
  return processingOrderService.update(processingOrder.id, { status: resumedStatus, holdReason: undefined });
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export const processingOrderActionHooks = {
  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: createProcessingOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["processing-orders"] }) });
  },
  useStartInternal: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: startInternalProcessing,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["processing-orders"] });
        queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      },
    });
  },
  useSend: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: sendProcessing,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["processing-orders"] });
        queryClient.invalidateQueries({ queryKey: ["processing-transactions"] });
      },
    });
  },
  useRecordReceipt: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: recordProcessingReceipt,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["processing-orders"] });
        queryClient.invalidateQueries({ queryKey: ["processing-transactions"] });
        queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      },
    });
  },
  useHold: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: holdProcessingOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["processing-orders"] }) });
  },
  useResume: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: resumeProcessingOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["processing-orders"] }) });
  },
};
