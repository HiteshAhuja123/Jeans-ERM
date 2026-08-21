import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import {
  deriveFinishingOrderStatus,
  generateFinishingOrderNumber,
  getFinishingOrderQuantitySummary,
  syncStageOnFinishing,
} from "@/lib/post-sewing-utils";
import { productionOrderService } from "@/features/production/service";
import { mockFinishingEntries, mockFinishingOrders } from "@/mock-data";
import type { FinishingEntry, FinishingOrder, ProcessingOrder } from "@/types";

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const finishingOrderService = createMasterDataService<FinishingOrder>(mockFinishingOrders, "fin");
export const finishingOrderHooks = createMasterDataHooks("finishing-orders", finishingOrderService);

async function syncProductionOrderForFinishing(productionOrderId: string) {
  const po = await productionOrderService.getById(productionOrderId);
  if (!po) return;
  const allFinishing = await finishingOrderService.list();
  const patch = syncStageOnFinishing(po, allFinishing.filter((f) => f.productionOrderId === productionOrderId));
  if (patch) await productionOrderService.update(productionOrderId, patch);
}

// ---------------------------------------------------------------------------
// Output entries
// ---------------------------------------------------------------------------

let entries = [...mockFinishingEntries];
let entryCounter = entries.length;

export const finishingEntryService = {
  list: () => delay([...entries]),
  listByFinishingOrder: (finishingOrderId: string) => delay(entries.filter((e) => e.finishingOrderId === finishingOrderId)),
};

export const finishingEntryHooks = {
  useList: () => useQuery({ queryKey: ["finishing-entries"], queryFn: finishingEntryService.list }),
  useByFinishingOrder: (finishingOrderId: string | undefined) =>
    useQuery({
      queryKey: ["finishing-entries", "finishing-order", finishingOrderId],
      queryFn: () => finishingEntryService.listByFinishingOrder(finishingOrderId as string),
      enabled: Boolean(finishingOrderId),
    }),
};

// ---------------------------------------------------------------------------
// Create Finishing Order
// ---------------------------------------------------------------------------

export interface CreateFinishingOrderInput {
  processingOrder: ProcessingOrder;
  quantity: number;
  responsible?: string;
  plannedStart?: string;
  plannedEnd?: string;
  notes?: string;
}

async function createFinishingOrder(input: CreateFinishingOrderInput) {
  const existing = await finishingOrderService.list();
  const finishingOrderNumber = generateFinishingOrderNumber(existing);
  return finishingOrderService.create({
    finishingOrderNumber,
    processingOrderId: input.processingOrder.id,
    processingOrderNumber: input.processingOrder.processingOrderNumber,
    sewingOrderId: input.processingOrder.sewingOrderId,
    productionOrderId: input.processingOrder.productionOrderId,
    productionOrderNumber: input.processingOrder.productionOrderNumber,
    orderId: input.processingOrder.orderId,
    orderNumber: input.processingOrder.orderNumber,
    customerId: input.processingOrder.customerId,
    customerName: input.processingOrder.customerName,
    styleId: input.processingOrder.styleId,
    styleCode: input.processingOrder.styleCode,
    styleName: input.processingOrder.styleName,
    colorId: input.processingOrder.colorId,
    colorName: input.processingOrder.colorName,
    quantity: input.quantity,
    unit: input.processingOrder.unit,
    responsible: input.responsible || undefined,
    status: "planned",
    plannedStart: input.plannedStart || undefined,
    plannedEnd: input.plannedEnd || undefined,
    createdDate: new Date().toISOString().slice(0, 10),
    notes: input.notes,
  });
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function startFinishing(finishingOrder: FinishingOrder) {
  return finishingOrderService.update(finishingOrder.id, {
    status: "in_progress",
    actualStart: finishingOrder.actualStart ?? new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Record output
// ---------------------------------------------------------------------------

export interface RecordFinishingOutputInput {
  finishingOrder: FinishingOrder;
  date: string;
  processedQuantity: number;
  outputQuantity: number;
  issueQuantity: number;
  issueReasonId?: string;
  notes?: string;
  recordedBy: string;
}

async function recordFinishingOutput(input: RecordFinishingOutputInput) {
  entryCounter += 1;
  const timestamp = new Date().toISOString();
  const entry: FinishingEntry = {
    id: `fne-${entryCounter}`,
    finishingOrderId: input.finishingOrder.id,
    date: input.date,
    processedQuantity: input.processedQuantity,
    outputQuantity: input.outputQuantity,
    issueQuantity: input.issueQuantity,
    issueReasonId: input.issueQuantity > 0 ? input.issueReasonId : undefined,
    notes: input.notes,
    recordedBy: input.recordedBy,
    recordedDate: timestamp,
  };
  entries = [entry, ...entries];

  const orderEntries = entries.filter((e) => e.finishingOrderId === input.finishingOrder.id);
  const summary = getFinishingOrderQuantitySummary(input.finishingOrder, orderEntries);
  const nextStatus = deriveFinishingOrderStatus(input.finishingOrder.status, summary);
  const patch: Partial<Omit<FinishingOrder, "id">> = { status: nextStatus };
  if (!input.finishingOrder.actualStart) patch.actualStart = timestamp;
  if (nextStatus === "completed" && !input.finishingOrder.actualEnd) patch.actualEnd = timestamp;
  const finishingOrder = await finishingOrderService.update(input.finishingOrder.id, patch);

  await syncProductionOrderForFinishing(input.finishingOrder.productionOrderId);

  return { entry, finishingOrder };
}

// ---------------------------------------------------------------------------
// Hold / resume
// ---------------------------------------------------------------------------

async function holdFinishingOrder({ finishingOrder, reason }: { finishingOrder: FinishingOrder; reason: string }) {
  return finishingOrderService.update(finishingOrder.id, { status: "on_hold", holdReason: reason });
}

async function resumeFinishingOrder(finishingOrder: FinishingOrder) {
  const orderEntries = entries.filter((e) => e.finishingOrderId === finishingOrder.id);
  const summary = getFinishingOrderQuantitySummary(finishingOrder, orderEntries);
  const resumedStatus = summary.processed > 0 ? "in_progress" : "planned";
  return finishingOrderService.update(finishingOrder.id, { status: resumedStatus, holdReason: undefined });
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export const finishingOrderActionHooks = {
  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: createFinishingOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["finishing-orders"] }) });
  },
  useStart: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: startFinishing, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["finishing-orders"] }) });
  },
  useHold: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: holdFinishingOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["finishing-orders"] }) });
  },
  useResume: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: resumeFinishingOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["finishing-orders"] }) });
  },
};

export const finishingProductionActionHooks = {
  useRecord: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: recordFinishingOutput,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["finishing-entries"] });
        queryClient.invalidateQueries({ queryKey: ["finishing-orders"] });
        queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      },
    });
  },
};
