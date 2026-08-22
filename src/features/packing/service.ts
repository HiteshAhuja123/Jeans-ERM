import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import {
  derivePackingOrderStatus,
  generateCartonNumbers,
  generatePackingOrderNumber,
  getPackingOrderQuantitySummary,
  syncStageOnPacking,
} from "@/lib/packing-utils";
import { productionOrderService } from "@/features/production/service";
import { finishedGoodsService } from "@/features/inventory/finished-goods-service";
import { mockPackingCartons, mockPackingEntries, mockPackingOrders } from "@/mock-data";
import type { PackingCarton, PackingEntry, PackingOrder, QcOrder } from "@/types";

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const packingOrderService = createMasterDataService<PackingOrder>(mockPackingOrders, "pack");
export const packingOrderHooks = createMasterDataHooks("packing-orders", packingOrderService);

async function syncProductionOrderForPacking(productionOrderId: string) {
  const po = await productionOrderService.getById(productionOrderId);
  if (!po) return;
  const allPacking = await packingOrderService.list();
  const patch = syncStageOnPacking(po, allPacking.filter((p) => p.productionOrderId === productionOrderId));
  if (patch) await productionOrderService.update(productionOrderId, patch);
}

// ---------------------------------------------------------------------------
// Packing entries + cartons
// ---------------------------------------------------------------------------

let entries = [...mockPackingEntries];
let entryCounter = entries.length;
let cartons = [...mockPackingCartons];

export const packingEntryService = {
  list: () => delay([...entries]),
  listByPackingOrder: (packingOrderId: string) => delay(entries.filter((e) => e.packingOrderId === packingOrderId)),
};

export const packingEntryHooks = {
  useList: () => useQuery({ queryKey: ["packing-entries"], queryFn: packingEntryService.list }),
  useByPackingOrder: (packingOrderId: string | undefined) =>
    useQuery({
      queryKey: ["packing-entries", "packing-order", packingOrderId],
      queryFn: () => packingEntryService.listByPackingOrder(packingOrderId as string),
      enabled: Boolean(packingOrderId),
    }),
};

export const packingCartonService = {
  list: () => delay([...cartons]),
  listByPackingOrder: (packingOrderId: string) => delay(cartons.filter((c) => c.packingOrderId === packingOrderId)),
};

export const packingCartonHooks = {
  useList: () => useQuery({ queryKey: ["packing-cartons"], queryFn: packingCartonService.list }),
  useByPackingOrder: (packingOrderId: string | undefined) =>
    useQuery({
      queryKey: ["packing-cartons", "packing-order", packingOrderId],
      queryFn: () => packingCartonService.listByPackingOrder(packingOrderId as string),
      enabled: Boolean(packingOrderId),
    }),
};

// ---------------------------------------------------------------------------
// Create Packing Order
// ---------------------------------------------------------------------------

export interface CreatePackingOrderInput {
  qcOrder: QcOrder;
  quantity: number;
  responsible?: string;
  plannedStart?: string;
  plannedEnd?: string;
  notes?: string;
}

async function createPackingOrder(input: CreatePackingOrderInput) {
  const existing = await packingOrderService.list();
  const packingOrderNumber = generatePackingOrderNumber(existing);
  return packingOrderService.create({
    packingOrderNumber,
    qcOrderId: input.qcOrder.id,
    qcOrderNumber: input.qcOrder.qcOrderNumber,
    finishingOrderId: input.qcOrder.finishingOrderId,
    processingOrderId: input.qcOrder.processingOrderId,
    sewingOrderId: input.qcOrder.sewingOrderId,
    productionOrderId: input.qcOrder.productionOrderId,
    productionOrderNumber: input.qcOrder.productionOrderNumber,
    orderId: input.qcOrder.orderId,
    orderNumber: input.qcOrder.orderNumber,
    customerId: input.qcOrder.customerId,
    customerName: input.qcOrder.customerName,
    styleId: input.qcOrder.styleId,
    styleCode: input.qcOrder.styleCode,
    styleName: input.qcOrder.styleName,
    colorId: input.qcOrder.colorId,
    colorName: input.qcOrder.colorName,
    quantity: input.quantity,
    unit: input.qcOrder.unit,
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

async function startPacking(packingOrder: PackingOrder) {
  return packingOrderService.update(packingOrder.id, {
    status: "in_progress",
    actualStart: packingOrder.actualStart ?? new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Record packing
// ---------------------------------------------------------------------------

export interface RecordPackingInput {
  packingOrder: PackingOrder;
  date: string;
  packedQuantity: number;
  cartonCount: number;
  notes?: string;
  recordedBy: string;
}

async function recordPacking(input: RecordPackingInput) {
  entryCounter += 1;
  const timestamp = new Date().toISOString();
  const entry: PackingEntry = {
    id: `pke-${String(entryCounter).padStart(3, "0")}`,
    packingOrderId: input.packingOrder.id,
    date: input.date,
    packedQuantity: input.packedQuantity,
    cartonCount: input.cartonCount,
    notes: input.notes,
    recordedBy: input.recordedBy,
    recordedDate: timestamp,
  };
  entries = [entry, ...entries];

  const basePerCarton = Math.floor(input.packedQuantity / input.cartonCount);
  const remainder = input.packedQuantity % input.cartonCount;
  const existingForOrder = cartons.filter((c) => c.packingOrderId === input.packingOrder.id);
  const cartonNumbers = generateCartonNumbers(input.packingOrder.packingOrderNumber, existingForOrder, input.cartonCount);
  const newCartons: PackingCarton[] = cartonNumbers.map((cartonNumber, i) => ({
    id: `${entry.id}-c${String(i + 1).padStart(3, "0")}`,
    packingOrderId: input.packingOrder.id,
    packingEntryId: entry.id,
    cartonNumber,
    quantity: basePerCarton + (i < remainder ? 1 : 0),
    createdDate: input.date,
  }));
  cartons = [...cartons, ...newCartons];

  const orderEntries = entries.filter((e) => e.packingOrderId === input.packingOrder.id);
  const summary = getPackingOrderQuantitySummary(input.packingOrder, orderEntries);
  const nextStatus = derivePackingOrderStatus(input.packingOrder.status, summary);
  const patch: Partial<Omit<PackingOrder, "id">> = { status: nextStatus };
  if (!input.packingOrder.actualStart) patch.actualStart = timestamp;
  if (nextStatus === "packed" && !input.packingOrder.actualEnd) patch.actualEnd = timestamp;
  const packingOrder = await packingOrderService.update(input.packingOrder.id, patch);

  await finishedGoodsService.receiveFromPacking({
    packingOrder: input.packingOrder,
    quantity: input.packedQuantity,
    reference: input.packingOrder.packingOrderNumber,
    performedBy: input.recordedBy,
  });

  await syncProductionOrderForPacking(input.packingOrder.productionOrderId);

  return { entry, cartons: newCartons, packingOrder };
}

// ---------------------------------------------------------------------------
// Hold / resume
// ---------------------------------------------------------------------------

async function holdPackingOrder({ packingOrder, reason }: { packingOrder: PackingOrder; reason: string }) {
  return packingOrderService.update(packingOrder.id, { status: "on_hold", holdReason: reason });
}

async function resumePackingOrder(packingOrder: PackingOrder) {
  const orderEntries = entries.filter((e) => e.packingOrderId === packingOrder.id);
  const summary = getPackingOrderQuantitySummary(packingOrder, orderEntries);
  const resumedStatus = summary.packed > 0 ? "in_progress" : "planned";
  return packingOrderService.update(packingOrder.id, { status: resumedStatus, holdReason: undefined });
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export const packingOrderActionHooks = {
  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: createPackingOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["packing-orders"] }) });
  },
  useStart: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: startPacking, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["packing-orders"] }) });
  },
  useHold: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: holdPackingOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["packing-orders"] }) });
  },
  useResume: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: resumePackingOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["packing-orders"] }) });
  },
};

export const packingProductionActionHooks = {
  useRecord: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: recordPacking,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["packing-entries"] });
        queryClient.invalidateQueries({ queryKey: ["packing-cartons"] });
        queryClient.invalidateQueries({ queryKey: ["packing-orders"] });
        queryClient.invalidateQueries({ queryKey: ["production-orders"] });
        queryClient.invalidateQueries({ queryKey: ["finished-goods-balances"] });
        queryClient.invalidateQueries({ queryKey: ["finished-goods-movements"] });
      },
    });
  },
};
