import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import {
  deriveBundleStatusAfterEntry,
  deriveSewingOrderStatus,
  generateReworkNumber,
  generateSewingOrderNumber,
  getSewingOrderQuantitySummary,
} from "@/lib/sewing-utils";
import { bundleService } from "@/features/cutting/bundle-service";
import {
  mockSewingDefects,
  mockSewingOrderBundles,
  mockSewingOrders,
  mockSewingProductionEntries,
  mockSewingReworks,
} from "@/mock-data";
import type {
  Bundle,
  ProductionOrder,
  SewingDefect,
  SewingOrder,
  SewingOrderBundle,
  SewingProductionEntry,
  SewingRework,
} from "@/types";

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const sewingOrderService = createMasterDataService<SewingOrder>(mockSewingOrders, "sew");
export const sewingOrderHooks = createMasterDataHooks("sewing-orders", sewingOrderService);

// ---------------------------------------------------------------------------
// Bundle assignment links — hand-rolled, mirrors fabric allocation/issue in cutting/service.ts.
// ---------------------------------------------------------------------------

let bundleLinks = [...mockSewingOrderBundles];
let linkCounter = bundleLinks.length;

export const sewingOrderBundleService = {
  list: () => delay([...bundleLinks]),
  listBySewingOrder: (sewingOrderId: string) => delay(bundleLinks.filter((l) => l.sewingOrderId === sewingOrderId)),
};

export const sewingOrderBundleHooks = {
  useList: () => useQuery({ queryKey: ["sewing-order-bundles"], queryFn: sewingOrderBundleService.list }),
  useBySewingOrder: (sewingOrderId: string | undefined) =>
    useQuery({
      queryKey: ["sewing-order-bundles", "sewing-order", sewingOrderId],
      queryFn: () => sewingOrderBundleService.listBySewingOrder(sewingOrderId as string),
      enabled: Boolean(sewingOrderId),
    }),
};

// ---------------------------------------------------------------------------
// Production entries
// ---------------------------------------------------------------------------

let entries = [...mockSewingProductionEntries];
let entryCounter = entries.length;

export const sewingProductionEntryService = {
  list: () => delay([...entries]),
  listBySewingOrder: (sewingOrderId: string) => delay(entries.filter((e) => e.sewingOrderId === sewingOrderId)),
  listByBundle: (bundleId: string) => delay(entries.filter((e) => e.bundleId === bundleId)),
};

export const sewingProductionEntryHooks = {
  useList: () => useQuery({ queryKey: ["sewing-production-entries"], queryFn: sewingProductionEntryService.list }),
  useBySewingOrder: (sewingOrderId: string | undefined) =>
    useQuery({
      queryKey: ["sewing-production-entries", "sewing-order", sewingOrderId],
      queryFn: () => sewingProductionEntryService.listBySewingOrder(sewingOrderId as string),
      enabled: Boolean(sewingOrderId),
    }),
};

// ---------------------------------------------------------------------------
// Defects
// ---------------------------------------------------------------------------

let defects = [...mockSewingDefects];
let defectCounter = defects.length;

export const sewingDefectService = {
  list: () => delay([...defects]),
  listBySewingOrder: (sewingOrderId: string) => delay(defects.filter((d) => d.sewingOrderId === sewingOrderId)),
};

export const sewingDefectHooks = {
  useList: () => useQuery({ queryKey: ["sewing-defects"], queryFn: sewingDefectService.list }),
  useBySewingOrder: (sewingOrderId: string | undefined) =>
    useQuery({
      queryKey: ["sewing-defects", "sewing-order", sewingOrderId],
      queryFn: () => sewingDefectService.listBySewingOrder(sewingOrderId as string),
      enabled: Boolean(sewingOrderId),
    }),
};

// ---------------------------------------------------------------------------
// Rework
// ---------------------------------------------------------------------------

let reworks = [...mockSewingReworks];
let reworkCounter = reworks.length;

export const sewingReworkService = {
  list: () => delay([...reworks]),
  listBySewingOrder: (sewingOrderId: string) => delay(reworks.filter((r) => r.sewingOrderId === sewingOrderId)),
};

export const sewingReworkHooks = {
  useList: () => useQuery({ queryKey: ["sewing-reworks"], queryFn: sewingReworkService.list }),
  useBySewingOrder: (sewingOrderId: string | undefined) =>
    useQuery({
      queryKey: ["sewing-reworks", "sewing-order", sewingOrderId],
      queryFn: () => sewingReworkService.listBySewingOrder(sewingOrderId as string),
      enabled: Boolean(sewingOrderId),
    }),
};

// ---------------------------------------------------------------------------
// Create Sewing Order
// ---------------------------------------------------------------------------

export interface CreateSewingOrderInput {
  productionOrder: ProductionOrder;
  skuId?: string;
  priority: SewingOrder["priority"];
  notes?: string;
}

async function createSewingOrder(input: CreateSewingOrderInput) {
  const existing = await sewingOrderService.list();
  const sewingOrderNumber = generateSewingOrderNumber(existing);
  return sewingOrderService.create({
    sewingOrderNumber,
    productionOrderId: input.productionOrder.id,
    productionOrderNumber: input.productionOrder.productionOrderNumber,
    orderId: input.productionOrder.orderId,
    orderNumber: input.productionOrder.orderNumber,
    customerId: input.productionOrder.customerId,
    customerName: input.productionOrder.customerName,
    styleId: input.productionOrder.styleId,
    styleCode: input.productionOrder.styleCode,
    styleName: input.productionOrder.styleName,
    colorId: input.productionOrder.colorId,
    colorName: input.productionOrder.colorName,
    skuId: input.skuId,
    quantity: 0,
    unit: input.productionOrder.unit,
    priority: input.priority,
    status: "planned",
    createdDate: new Date().toISOString().slice(0, 10),
    notes: input.notes,
  });
}

// ---------------------------------------------------------------------------
// Assign bundles + line
// ---------------------------------------------------------------------------

export interface AssignSewingOrderInput {
  sewingOrder: SewingOrder;
  bundles: Bundle[];
  productionLineId: string;
  supervisor: string;
  plannedStart: string;
  plannedEnd: string;
}

/**
 * Links the selected bundles to this Sewing Order, advances each bundle to "Assigned", and sets
 * the line/supervisor/schedule. Does not automatically change a line the supervisor already
 * picked — it only ever adds the bundles/line the supervisor explicitly confirmed here.
 */
async function assignSewingOrder(input: AssignSewingOrderInput) {
  const assignedDate = new Date().toISOString().slice(0, 10);
  const newLinks: SewingOrderBundle[] = input.bundles.map((bundle) => {
    linkCounter += 1;
    return {
      id: `sob-${linkCounter}`,
      sewingOrderId: input.sewingOrder.id,
      bundleId: bundle.id,
      bundleNumber: bundle.bundleNumber,
      quantity: bundle.quantity,
      assignedDate,
    };
  });
  bundleLinks = [...bundleLinks, ...newLinks];

  for (const bundle of input.bundles) {
    await bundleService.update(bundle.id, { status: "assigned" });
  }

  const totalAssigned = bundleLinks
    .filter((l) => l.sewingOrderId === input.sewingOrder.id)
    .reduce((sum, l) => sum + l.quantity, 0);

  const nextStatus = input.sewingOrder.status === "planned" ? "assigned" : input.sewingOrder.status;

  return sewingOrderService.update(input.sewingOrder.id, {
    productionLineId: input.productionLineId,
    supervisor: input.supervisor,
    plannedStart: input.plannedStart,
    plannedEnd: input.plannedEnd,
    quantity: totalAssigned,
    status: nextStatus,
  });
}

// ---------------------------------------------------------------------------
// Start sewing
// ---------------------------------------------------------------------------

async function startSewing(sewingOrder: SewingOrder) {
  const links = bundleLinks.filter((l) => l.sewingOrderId === sewingOrder.id);
  for (const link of links) {
    const bundle = await bundleService.getById(link.bundleId);
    if (bundle?.status === "assigned") {
      await bundleService.update(bundle.id, { status: "in_sewing" });
    }
  }
  return sewingOrderService.update(sewingOrder.id, {
    status: "in_progress",
    actualStart: sewingOrder.actualStart ?? new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Record production
// ---------------------------------------------------------------------------

export interface RecordSewingProductionInput {
  sewingOrder: SewingOrder;
  bundle: Bundle;
  date: string;
  inputQuantity: number;
  goodQuantity: number;
  rejectedQuantity: number;
  reworkQuantity: number;
  reasonId?: string;
  notes?: string;
  recordedBy: string;
}

/**
 * Records one production entry, raises a Defect + (if any) a pending Rework for the
 * rejected/rework pieces, rolls the bundle status forward by processed quantity (never a bare
 * status click), and re-derives the Sewing Order status from the resulting quantity summary.
 */
async function recordSewingProduction(input: RecordSewingProductionInput) {
  entryCounter += 1;
  const timestamp = new Date().toISOString();
  const entry: SewingProductionEntry = {
    id: `spe-${entryCounter}`,
    sewingOrderId: input.sewingOrder.id,
    bundleId: input.bundle.id,
    bundleNumber: input.bundle.bundleNumber,
    date: input.date,
    inputQuantity: input.inputQuantity,
    goodQuantity: input.goodQuantity,
    rejectedQuantity: input.rejectedQuantity,
    reworkQuantity: input.reworkQuantity,
    notes: input.notes,
    recordedBy: input.recordedBy,
    recordedDate: timestamp,
  };
  entries = [entry, ...entries];

  const defectQuantity = input.rejectedQuantity + input.reworkQuantity;
  let defect: SewingDefect | undefined;
  if (defectQuantity > 0 && input.reasonId) {
    defectCounter += 1;
    defect = {
      id: `sdf-${defectCounter}`,
      sewingOrderId: input.sewingOrder.id,
      bundleId: input.bundle.id,
      productionEntryId: entry.id,
      reasonId: input.reasonId,
      quantity: defectQuantity,
      notes: input.notes,
      recordedBy: input.recordedBy,
      date: input.date,
    };
    defects = [defect, ...defects];
  }

  let rework: SewingRework | undefined;
  if (input.reworkQuantity > 0 && input.reasonId) {
    reworkCounter += 1;
    const existingReworks = await sewingReworkService.list();
    rework = {
      id: `rwk-${reworkCounter}`,
      reworkNumber: generateReworkNumber(existingReworks),
      sewingOrderId: input.sewingOrder.id,
      bundleId: input.bundle.id,
      productionEntryId: entry.id,
      defectId: defect?.id,
      quantity: input.reworkQuantity,
      reasonId: input.reasonId,
      status: "pending",
      createdDate: input.date,
      recordedBy: input.recordedBy,
    };
    reworks = [rework, ...reworks];
  }

  const bundleStatus = deriveBundleStatusAfterEntry(input.bundle, entries);
  await bundleService.update(input.bundle.id, { status: bundleStatus });

  const orderReworks = reworks.filter((r) => r.sewingOrderId === input.sewingOrder.id);
  const summary = getSewingOrderQuantitySummary(input.sewingOrder, entries, orderReworks);
  const nextStatus = deriveSewingOrderStatus(input.sewingOrder.status, summary);
  const patch: Partial<Omit<SewingOrder, "id">> = { status: nextStatus };
  if (!input.sewingOrder.actualStart) patch.actualStart = timestamp;
  if (nextStatus === "completed" && !input.sewingOrder.actualEnd) patch.actualEnd = timestamp;
  const sewingOrder = await sewingOrderService.update(input.sewingOrder.id, patch);

  return { entry, defect, rework, sewingOrder };
}

// ---------------------------------------------------------------------------
// Rework completion
// ---------------------------------------------------------------------------

export interface CompleteReworkInput {
  rework: SewingRework;
  sewingOrder: SewingOrder;
  completedQuantity: number;
  rejectedQuantity: number;
}

/** Resolves a rework batch to a final good/rejected split — never re-adds pieces already counted as good in the original entry. */
async function completeRework(input: CompleteReworkInput) {
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

  const orderReworks = reworks.filter((r) => r.sewingOrderId === input.sewingOrder.id);
  const summary = getSewingOrderQuantitySummary(input.sewingOrder, entries, orderReworks);
  const nextStatus = deriveSewingOrderStatus(input.sewingOrder.status, summary);
  const sewingOrder =
    nextStatus === input.sewingOrder.status
      ? input.sewingOrder
      : await sewingOrderService.update(input.sewingOrder.id, { status: nextStatus });

  return { rework: reworks.find((r) => r.id === input.rework.id)!, sewingOrder };
}

// ---------------------------------------------------------------------------
// Hold / resume
// ---------------------------------------------------------------------------

async function holdSewingOrder({ sewingOrder, reason }: { sewingOrder: SewingOrder; reason: string }) {
  return sewingOrderService.update(sewingOrder.id, { status: "on_hold", holdReason: reason });
}

async function resumeSewingOrder(sewingOrder: SewingOrder) {
  const orderReworks = reworks.filter((r) => r.sewingOrderId === sewingOrder.id);
  const summary = getSewingOrderQuantitySummary(sewingOrder, entries, orderReworks);
  const resumedStatus = summary.input > 0 ? "in_progress" : sewingOrder.productionLineId ? "assigned" : "planned";
  return sewingOrderService.update(sewingOrder.id, { status: resumedStatus, holdReason: undefined });
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export const sewingOrderActionHooks = {
  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: createSewingOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sewing-orders"] }) });
  },
  useAssign: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: assignSewingOrder,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["sewing-orders"] });
        queryClient.invalidateQueries({ queryKey: ["sewing-order-bundles"] });
        queryClient.invalidateQueries({ queryKey: ["bundles"] });
      },
    });
  },
  useStart: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: startSewing,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["sewing-orders"] });
        queryClient.invalidateQueries({ queryKey: ["bundles"] });
      },
    });
  },
  useHold: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: holdSewingOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sewing-orders"] }) });
  },
  useResume: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: resumeSewingOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sewing-orders"] }) });
  },
};

export const sewingProductionActionHooks = {
  useRecord: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: recordSewingProduction,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["sewing-production-entries"] });
        queryClient.invalidateQueries({ queryKey: ["sewing-defects"] });
        queryClient.invalidateQueries({ queryKey: ["sewing-reworks"] });
        queryClient.invalidateQueries({ queryKey: ["sewing-orders"] });
        queryClient.invalidateQueries({ queryKey: ["bundles"] });
      },
    });
  },
};

export const sewingReworkActionHooks = {
  useComplete: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: completeRework,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["sewing-reworks"] });
        queryClient.invalidateQueries({ queryKey: ["sewing-orders"] });
      },
    });
  },
};
