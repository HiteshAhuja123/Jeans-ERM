import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { inventoryService } from "@/features/inventory/service";
import {
  mockCuttingBatches,
  mockCuttingOrders,
  mockCuttingOutputs,
  mockCuttingPlans,
  mockCuttingRejections,
  mockFabricAllocations,
  mockFabricIssues,
  mockMaterialReturns,
} from "@/mock-data";
import type {
  CuttingBatch,
  CuttingOrder,
  CuttingOutput,
  CuttingPlan,
  CuttingRejection,
  FabricAllocation,
  FabricIssue,
  MaterialReturn,
  OrderItemSizeQty,
} from "@/types";

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const cuttingOrderService = createMasterDataService<CuttingOrder>(mockCuttingOrders, "cut");
export const cuttingOrderHooks = createMasterDataHooks("cutting-orders", cuttingOrderService);

export const cuttingPlanService = createMasterDataService<CuttingPlan>(mockCuttingPlans, "cp");
export const cuttingPlanHooks = createMasterDataHooks("cutting-plans", cuttingPlanService);

export const cuttingBatchService = createMasterDataService<CuttingBatch>(mockCuttingBatches, "cb");
export const cuttingBatchHooks = createMasterDataHooks("cutting-batches", cuttingBatchService);

// ---------------------------------------------------------------------------
// Fabric allocation & issue — hand-rolled, mirrors features/inventory/service.ts:
// every mutation is domain-specific and (where it touches physical stock) always
// logs through the shared inventoryService rather than mutating balances directly.
// ---------------------------------------------------------------------------

let allocations = [...mockFabricAllocations];
let issues = [...mockFabricIssues];
let issueCounter = issues.length;
let returns = [...mockMaterialReturns];
let returnCounter = returns.length;

function totalIssuedForAllocation(allocationId: string): number {
  return issues.filter((i) => i.fabricAllocationId === allocationId).reduce((sum, i) => sum + i.quantity, 0);
}

export const fabricAllocationService = {
  list: () => delay([...allocations]),
  listByCuttingOrder: (cuttingOrderId: string) => delay(allocations.filter((a) => a.cuttingOrderId === cuttingOrderId)),
  create: (input: Omit<FabricAllocation, "id">) => {
    const allocation: FabricAllocation = { ...input, id: `fa-${allocations.length + 1}` };
    allocations = [allocation, ...allocations];
    return delay(allocation);
  },
};

export const fabricIssueService = {
  list: () => delay([...issues]),
  listByCuttingOrder: (cuttingOrderId: string) => delay(issues.filter((i) => i.cuttingOrderId === cuttingOrderId)),
};

export const materialReturnService = {
  list: () => delay([...returns]),
  listByCuttingOrder: (cuttingOrderId: string) => delay(returns.filter((r) => r.cuttingOrderId === cuttingOrderId)),
};

export interface IssueFabricInput {
  cuttingOrder: CuttingOrder;
  fabricAllocationId: string;
  quantity: number;
  warehouseId: string;
  locationId: string;
  issuedBy: string;
}

/** Issuing fabric always creates a StockMovement through the Phase 5 inventory service — never a silent stock edit. */
async function issueFabric(input: IssueFabricInput) {
  const movement = await inventoryService.issueStock({
    materialId: input.cuttingOrder.materialId,
    materialName: input.cuttingOrder.materialName,
    quantity: input.quantity,
    unit: input.cuttingOrder.unit,
    warehouseId: input.warehouseId,
    locationId: input.locationId,
    reference: input.cuttingOrder.cuttingOrderNumber,
    performedBy: input.issuedBy,
  });

  issueCounter += 1;
  const issue: FabricIssue = {
    id: `fi-${issueCounter}`,
    cuttingOrderId: input.cuttingOrder.id,
    fabricAllocationId: input.fabricAllocationId,
    materialId: input.cuttingOrder.materialId,
    materialCode: input.cuttingOrder.materialCode,
    materialName: input.cuttingOrder.materialName,
    quantity: input.quantity,
    unit: input.cuttingOrder.unit,
    warehouseId: input.warehouseId,
    locationId: input.locationId,
    issuedBy: input.issuedBy,
    issuedDate: new Date().toISOString().slice(0, 10),
    movementId: movement.id,
  };
  issues = [issue, ...issues];

  const allocation = allocations.find((a) => a.id === input.fabricAllocationId);
  if (allocation) {
    const totalIssued = totalIssuedForAllocation(allocation.id);
    allocations = allocations.map((a) =>
      a.id === allocation.id
        ? { ...a, status: totalIssued >= a.quantity ? "issued" : totalIssued > 0 ? "partially_issued" : a.status }
        : a,
    );
  }

  return issue;
}

export interface ReturnMaterialInput {
  cuttingOrder: CuttingOrder;
  quantity: number;
  warehouseId: string;
  locationId: string;
  reason?: string;
  returnedBy: string;
}

async function returnMaterial(input: ReturnMaterialInput) {
  const movement = await inventoryService.returnStock({
    materialId: input.cuttingOrder.materialId,
    materialName: input.cuttingOrder.materialName,
    quantity: input.quantity,
    unit: input.cuttingOrder.unit,
    warehouseId: input.warehouseId,
    locationId: input.locationId,
    reference: input.cuttingOrder.cuttingOrderNumber,
    reason: input.reason,
    performedBy: input.returnedBy,
  });

  returnCounter += 1;
  const materialReturn: MaterialReturn = {
    id: `mr-${returnCounter}`,
    returnNumber: `RET-${new Date().getFullYear()}-${String(returnCounter).padStart(4, "0")}`,
    cuttingOrderId: input.cuttingOrder.id,
    materialId: input.cuttingOrder.materialId,
    materialCode: input.cuttingOrder.materialCode,
    materialName: input.cuttingOrder.materialName,
    quantity: input.quantity,
    unit: input.cuttingOrder.unit,
    warehouseId: input.warehouseId,
    locationId: input.locationId,
    reason: input.reason,
    returnedBy: input.returnedBy,
    returnedDate: new Date().toISOString().slice(0, 10),
    movementId: movement.id,
  };
  returns = [materialReturn, ...returns];
  return materialReturn;
}

// ---------------------------------------------------------------------------
// Cutting output & rejections
// ---------------------------------------------------------------------------

let outputs = [...mockCuttingOutputs];
let outputCounter = outputs.length;
let rejections = [...mockCuttingRejections];
let rejectionCounter = rejections.length;

export const cuttingOutputService = {
  list: () => delay([...outputs]),
  listByBatch: (batchId: string) => delay(outputs.filter((o) => o.cuttingBatchId === batchId)),
  listByCuttingOrder: (cuttingOrderId: string) => delay(outputs.filter((o) => o.cuttingOrderId === cuttingOrderId)),
};

export const cuttingRejectionService = {
  list: () => delay([...rejections]),
  listByCuttingOrder: (cuttingOrderId: string) => delay(rejections.filter((r) => r.cuttingOrderId === cuttingOrderId)),
};

export interface RecordCuttingOutputInput {
  batch: CuttingBatch;
  cutQuantity: number;
  rejectedQuantity: number;
  fabricUsed: number;
  unit: string;
  sizeBreakdown: OrderItemSizeQty[];
  wastageReasonId?: string;
  notes?: string;
  rejectionBreakdown: Array<{ reasonId: string; quantity: number }>;
  recordedBy: string;
  /** Sum of this batch's already-recorded cut quantity — used to derive whether the batch is now complete. */
  priorCutQuantity: number;
}

/**
 * Records one cutting output entry against a batch, logs any rejection-reason breakdown, and
 * rolls the batch's own status forward (pending -> in_progress on the first entry, -> completed
 * once cumulative cut reaches the planned quantity). Batch totals are always derived by summing
 * these entries — never edited directly.
 */
async function recordCuttingOutput(input: RecordCuttingOutputInput) {
  outputCounter += 1;
  const timestamp = new Date().toISOString();
  const output: CuttingOutput = {
    id: `co-${outputCounter}`,
    cuttingBatchId: input.batch.id,
    cuttingOrderId: input.batch.cuttingOrderId,
    cutQuantity: input.cutQuantity,
    rejectedQuantity: input.rejectedQuantity,
    fabricUsed: input.fabricUsed,
    unit: input.unit,
    sizeBreakdown: input.sizeBreakdown,
    wastageReasonId: input.wastageReasonId,
    notes: input.notes,
    recordedBy: input.recordedBy,
    recordedDate: timestamp,
  };
  outputs = [output, ...outputs];

  for (const line of input.rejectionBreakdown) {
    if (line.quantity <= 0) continue;
    rejectionCounter += 1;
    const rejection: CuttingRejection = {
      id: `cj-${rejectionCounter}`,
      cuttingOutputId: output.id,
      cuttingBatchId: input.batch.id,
      cuttingOrderId: input.batch.cuttingOrderId,
      reasonId: line.reasonId,
      quantity: line.quantity,
      recordedBy: input.recordedBy,
      timestamp,
    };
    rejections = [rejection, ...rejections];
  }

  const cumulativeCut = input.priorCutQuantity + input.cutQuantity;
  const patch: Partial<Omit<CuttingBatch, "id">> = {};
  if (input.batch.status === "pending") {
    patch.status = "in_progress";
    patch.actualStart = input.batch.actualStart ?? timestamp;
  }
  if (cumulativeCut >= input.batch.plannedQuantity) {
    patch.status = "completed";
    patch.actualEnd = timestamp;
  }
  const batch = Object.keys(patch).length > 0 ? await cuttingBatchService.update(input.batch.id, patch) : input.batch;

  return { output, batch };
}

// ---------------------------------------------------------------------------
// Cutting order lifecycle actions
// ---------------------------------------------------------------------------

async function startCutting(cuttingOrder: CuttingOrder) {
  return cuttingOrderService.update(cuttingOrder.id, {
    status: "in_progress",
    actualStart: cuttingOrder.actualStart ?? new Date().toISOString(),
  });
}

async function holdCuttingOrder({ cuttingOrder, reason }: { cuttingOrder: CuttingOrder; reason: string }) {
  return cuttingOrderService.update(cuttingOrder.id, { status: "on_hold", holdReason: reason });
}

async function resumeCuttingOrder(cuttingOrder: CuttingOrder) {
  return cuttingOrderService.update(cuttingOrder.id, { status: "in_progress", holdReason: undefined });
}

async function holdCuttingBatch({ batch, reason }: { batch: CuttingBatch; reason: string }) {
  return cuttingBatchService.update(batch.id, { status: "on_hold", holdReason: reason });
}

async function resumeCuttingBatch(batch: CuttingBatch) {
  return cuttingBatchService.update(batch.id, { status: "in_progress", holdReason: undefined });
}

export interface CreateCuttingBatchInput {
  batchNumber: string;
  cuttingPlan: CuttingPlan;
  cuttingOrder: CuttingOrder;
  plannedQuantity: number;
  supervisor?: string;
  operator?: string;
  machineId?: string;
  plannedStart?: string;
  plannedEnd?: string;
}

async function createCuttingBatch(input: CreateCuttingBatchInput) {
  return cuttingBatchService.create({
    batchNumber: input.batchNumber,
    cuttingPlanId: input.cuttingPlan.id,
    cuttingOrderId: input.cuttingOrder.id,
    productionOrderId: input.cuttingOrder.productionOrderId,
    styleId: input.cuttingOrder.styleId,
    styleCode: input.cuttingOrder.styleCode,
    colorId: input.cuttingOrder.colorId,
    colorName: input.cuttingOrder.colorName,
    plannedQuantity: input.plannedQuantity,
    supervisor: input.supervisor,
    operator: input.operator,
    machineId: input.machineId,
    plannedStart: input.plannedStart,
    plannedEnd: input.plannedEnd,
    status: "pending",
    createdDate: new Date().toISOString().slice(0, 10),
  });
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export const fabricAllocationHooks = {
  useList: () => useQuery({ queryKey: ["fabric-allocations"], queryFn: fabricAllocationService.list }),
  useByCuttingOrder: (cuttingOrderId: string | undefined) =>
    useQuery({
      queryKey: ["fabric-allocations", "cutting-order", cuttingOrderId],
      queryFn: () => fabricAllocationService.listByCuttingOrder(cuttingOrderId as string),
      enabled: Boolean(cuttingOrderId),
    }),
};

export const fabricIssueHooks = {
  useList: () => useQuery({ queryKey: ["fabric-issues"], queryFn: fabricIssueService.list }),
  useByCuttingOrder: (cuttingOrderId: string | undefined) =>
    useQuery({
      queryKey: ["fabric-issues", "cutting-order", cuttingOrderId],
      queryFn: () => fabricIssueService.listByCuttingOrder(cuttingOrderId as string),
      enabled: Boolean(cuttingOrderId),
    }),
  useIssueFabric: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: issueFabric,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["fabric-issues"] });
        queryClient.invalidateQueries({ queryKey: ["fabric-allocations"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-balances"] });
        queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      },
    });
  },
};

export const materialReturnHooks = {
  useList: () => useQuery({ queryKey: ["material-returns"], queryFn: materialReturnService.list }),
  useByCuttingOrder: (cuttingOrderId: string | undefined) =>
    useQuery({
      queryKey: ["material-returns", "cutting-order", cuttingOrderId],
      queryFn: () => materialReturnService.listByCuttingOrder(cuttingOrderId as string),
      enabled: Boolean(cuttingOrderId),
    }),
  useReturnMaterial: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: returnMaterial,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["material-returns"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-balances"] });
        queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      },
    });
  },
};

export const cuttingOutputHooks = {
  useList: () => useQuery({ queryKey: ["cutting-outputs"], queryFn: cuttingOutputService.list }),
  useByBatch: (batchId: string | undefined) =>
    useQuery({
      queryKey: ["cutting-outputs", "batch", batchId],
      queryFn: () => cuttingOutputService.listByBatch(batchId as string),
      enabled: Boolean(batchId),
    }),
  useByCuttingOrder: (cuttingOrderId: string | undefined) =>
    useQuery({
      queryKey: ["cutting-outputs", "cutting-order", cuttingOrderId],
      queryFn: () => cuttingOutputService.listByCuttingOrder(cuttingOrderId as string),
      enabled: Boolean(cuttingOrderId),
    }),
  useRecordOutput: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: recordCuttingOutput,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["cutting-outputs"] });
        queryClient.invalidateQueries({ queryKey: ["cutting-batches"] });
        queryClient.invalidateQueries({ queryKey: ["cutting-rejections"] });
      },
    });
  },
};

export const cuttingRejectionHooks = {
  useList: () => useQuery({ queryKey: ["cutting-rejections"], queryFn: cuttingRejectionService.list }),
  useByCuttingOrder: (cuttingOrderId: string | undefined) =>
    useQuery({
      queryKey: ["cutting-rejections", "cutting-order", cuttingOrderId],
      queryFn: () => cuttingRejectionService.listByCuttingOrder(cuttingOrderId as string),
      enabled: Boolean(cuttingOrderId),
    }),
};

export const cuttingOrderActionHooks = {
  useStartCutting: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: startCutting, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cutting-orders"] }) });
  },
  useHold: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: holdCuttingOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cutting-orders"] }) });
  },
  useResume: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: resumeCuttingOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cutting-orders"] }) });
  },
};

export const cuttingBatchActionHooks = {
  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: createCuttingBatch, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cutting-batches"] }) });
  },
  useHold: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: holdCuttingBatch, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cutting-batches"] }) });
  },
  useResume: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: resumeCuttingBatch, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cutting-batches"] }) });
  },
};
