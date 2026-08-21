import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import {
  deriveQcOrderStatus,
  generateQcOrderNumber,
  generateQcReworkNumber,
  getQcQuantitySummary,
  syncStageOnQc,
} from "@/lib/post-sewing-utils";
import { productionOrderService } from "@/features/production/service";
import { mockQcInspectionEntries, mockQcOrders, mockQcReworks } from "@/mock-data";
import type { FinishingOrder, QcInspectionEntry, QcOrder, QcRework } from "@/types";

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const qcOrderService = createMasterDataService<QcOrder>(mockQcOrders, "qc");
export const qcOrderHooks = createMasterDataHooks("qc-orders", qcOrderService);

async function syncProductionOrderForQc(productionOrderId: string) {
  const po = await productionOrderService.getById(productionOrderId);
  if (!po) return;
  const allQc = await qcOrderService.list();
  const patch = syncStageOnQc(po, allQc.filter((q) => q.productionOrderId === productionOrderId));
  if (patch) await productionOrderService.update(productionOrderId, patch);
}

// ---------------------------------------------------------------------------
// Inspection entries
// ---------------------------------------------------------------------------

let entries = [...mockQcInspectionEntries];
let entryCounter = entries.length;

export const qcInspectionEntryService = {
  list: () => delay([...entries]),
  listByQcOrder: (qcOrderId: string) => delay(entries.filter((e) => e.qcOrderId === qcOrderId)),
};

export const qcInspectionEntryHooks = {
  useList: () => useQuery({ queryKey: ["qc-inspection-entries"], queryFn: qcInspectionEntryService.list }),
  useByQcOrder: (qcOrderId: string | undefined) =>
    useQuery({
      queryKey: ["qc-inspection-entries", "qc-order", qcOrderId],
      queryFn: () => qcInspectionEntryService.listByQcOrder(qcOrderId as string),
      enabled: Boolean(qcOrderId),
    }),
};

// ---------------------------------------------------------------------------
// Rework
// ---------------------------------------------------------------------------

let reworks = [...mockQcReworks];
let reworkCounter = reworks.length;

export const qcReworkService = {
  list: () => delay([...reworks]),
  listByQcOrder: (qcOrderId: string) => delay(reworks.filter((r) => r.qcOrderId === qcOrderId)),
};

export const qcReworkHooks = {
  useList: () => useQuery({ queryKey: ["qc-reworks"], queryFn: qcReworkService.list }),
  useByQcOrder: (qcOrderId: string | undefined) =>
    useQuery({
      queryKey: ["qc-reworks", "qc-order", qcOrderId],
      queryFn: () => qcReworkService.listByQcOrder(qcOrderId as string),
      enabled: Boolean(qcOrderId),
    }),
};

// ---------------------------------------------------------------------------
// Create QC Order
// ---------------------------------------------------------------------------

export interface CreateQcOrderInput {
  finishingOrder: FinishingOrder;
  quantity: number;
  inspector?: string;
  plannedStart?: string;
  notes?: string;
}

async function createQcOrder(input: CreateQcOrderInput) {
  const existing = await qcOrderService.list();
  const qcOrderNumber = generateQcOrderNumber(existing);
  return qcOrderService.create({
    qcOrderNumber,
    finishingOrderId: input.finishingOrder.id,
    finishingOrderNumber: input.finishingOrder.finishingOrderNumber,
    processingOrderId: input.finishingOrder.processingOrderId,
    sewingOrderId: input.finishingOrder.sewingOrderId,
    productionOrderId: input.finishingOrder.productionOrderId,
    productionOrderNumber: input.finishingOrder.productionOrderNumber,
    orderId: input.finishingOrder.orderId,
    orderNumber: input.finishingOrder.orderNumber,
    customerId: input.finishingOrder.customerId,
    customerName: input.finishingOrder.customerName,
    styleId: input.finishingOrder.styleId,
    styleCode: input.finishingOrder.styleCode,
    styleName: input.finishingOrder.styleName,
    colorId: input.finishingOrder.colorId,
    colorName: input.finishingOrder.colorName,
    quantity: input.quantity,
    unit: input.finishingOrder.unit,
    inspector: input.inspector || undefined,
    status: "planned",
    plannedStart: input.plannedStart || undefined,
    createdDate: new Date().toISOString().slice(0, 10),
    notes: input.notes,
  });
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function startQc(qcOrder: QcOrder) {
  return qcOrderService.update(qcOrder.id, {
    status: "in_progress",
    actualStart: qcOrder.actualStart ?? new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Record inspection
// ---------------------------------------------------------------------------

export interface RecordQcInspectionInput {
  qcOrder: QcOrder;
  date: string;
  inspectedQuantity: number;
  passedQuantity: number;
  reworkQuantity: number;
  rejectedQuantity: number;
  defectReasonId?: string;
  notes?: string;
  inspector: string;
}

async function recordQcInspection(input: RecordQcInspectionInput) {
  entryCounter += 1;
  const timestamp = new Date().toISOString();
  const entry: QcInspectionEntry = {
    id: `qie-${entryCounter}`,
    qcOrderId: input.qcOrder.id,
    date: input.date,
    inspectedQuantity: input.inspectedQuantity,
    passedQuantity: input.passedQuantity,
    reworkQuantity: input.reworkQuantity,
    rejectedQuantity: input.rejectedQuantity,
    defectReasonId: input.defectReasonId,
    notes: input.notes,
    inspector: input.inspector,
    recordedDate: timestamp,
  };
  entries = [entry, ...entries];

  let rework: QcRework | undefined;
  if (input.reworkQuantity > 0 && input.defectReasonId) {
    reworkCounter += 1;
    const existingReworks = await qcReworkService.list();
    rework = {
      id: `qrwk-${reworkCounter}`,
      reworkNumber: generateQcReworkNumber(existingReworks),
      qcOrderId: input.qcOrder.id,
      inspectionEntryId: entry.id,
      quantity: input.reworkQuantity,
      reasonId: input.defectReasonId,
      status: "pending",
      createdDate: input.date,
      recordedBy: input.inspector,
    };
    reworks = [rework, ...reworks];
  }

  const orderReworks = reworks.filter((r) => r.qcOrderId === input.qcOrder.id);
  const summary = getQcQuantitySummary(input.qcOrder, entries, orderReworks);
  const nextStatus = deriveQcOrderStatus(input.qcOrder.status, summary);
  const patch: Partial<Omit<QcOrder, "id">> = { status: nextStatus };
  if (!input.qcOrder.actualStart) patch.actualStart = timestamp;
  if (nextStatus === "approved" && !input.qcOrder.actualEnd) patch.actualEnd = timestamp;
  const qcOrder = await qcOrderService.update(input.qcOrder.id, patch);

  await syncProductionOrderForQc(input.qcOrder.productionOrderId);

  return { entry, rework, qcOrder };
}

// ---------------------------------------------------------------------------
// Rework completion
// ---------------------------------------------------------------------------

export interface CompleteQcReworkInput {
  rework: QcRework;
  qcOrder: QcOrder;
  completedQuantity: number;
  rejectedQuantity: number;
}

async function completeQcRework(input: CompleteQcReworkInput) {
  reworks = reworks.map((r) =>
    r.id === input.rework.id
      ? {
          ...r,
          status: input.rejectedQuantity === r.quantity ? "rejected" : "completed",
          completedQuantity: input.completedQuantity,
          rejectedQuantity: input.rejectedQuantity,
          completedDate: new Date().toISOString().slice(0, 10),
        }
      : r,
  );

  const orderReworks = reworks.filter((r) => r.qcOrderId === input.qcOrder.id);
  const summary = getQcQuantitySummary(input.qcOrder, entries, orderReworks);
  const nextStatus = deriveQcOrderStatus(input.qcOrder.status, summary);
  const patch: Partial<Omit<QcOrder, "id">> = { status: nextStatus };
  if (nextStatus === "approved" && !input.qcOrder.actualEnd) patch.actualEnd = new Date().toISOString();
  const qcOrder =
    nextStatus === input.qcOrder.status && !patch.actualEnd
      ? input.qcOrder
      : await qcOrderService.update(input.qcOrder.id, patch);

  await syncProductionOrderForQc(input.qcOrder.productionOrderId);

  return { rework: reworks.find((r) => r.id === input.rework.id)!, qcOrder };
}

// ---------------------------------------------------------------------------
// Hold / resume
// ---------------------------------------------------------------------------

async function holdQcOrder({ qcOrder, reason }: { qcOrder: QcOrder; reason: string }) {
  return qcOrderService.update(qcOrder.id, { status: "on_hold", holdReason: reason });
}

async function resumeQcOrder(qcOrder: QcOrder) {
  const orderEntries = entries.filter((e) => e.qcOrderId === qcOrder.id);
  const resumedStatus = orderEntries.length > 0 ? "in_progress" : "planned";
  return qcOrderService.update(qcOrder.id, { status: resumedStatus, holdReason: undefined });
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export const qcOrderActionHooks = {
  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: createQcOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["qc-orders"] }) });
  },
  useStart: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: startQc, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["qc-orders"] }) });
  },
  useHold: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: holdQcOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["qc-orders"] }) });
  },
  useResume: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: resumeQcOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["qc-orders"] }) });
  },
};

export const qcInspectionActionHooks = {
  useRecord: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: recordQcInspection,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["qc-inspection-entries"] });
        queryClient.invalidateQueries({ queryKey: ["qc-reworks"] });
        queryClient.invalidateQueries({ queryKey: ["qc-orders"] });
        queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      },
    });
  },
};

export const qcReworkActionHooks = {
  useComplete: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: completeQcRework,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["qc-reworks"] });
        queryClient.invalidateQueries({ queryKey: ["qc-orders"] });
        queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      },
    });
  },
};
