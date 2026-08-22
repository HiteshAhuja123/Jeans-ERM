import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { mockFinishedGoodsBalances, mockFinishedGoodsMovements } from "@/mock-data";
import type { FinishedGoodsBalance, FinishedGoodsMovement, PackingOrder } from "@/types";

/**
 * Hand-rolled in-memory service for Finished Goods balances + movements — mirrors
 * `src/features/inventory/service.ts` exactly (one balance per key, every mutation also appends a
 * movement, "never silently overwrite stock"), keyed by `productionOrderId` instead of `materialId`
 * since post-cutting stages in this codebase track style+color totals, not raw-material SKUs.
 */
function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

let balances = [...mockFinishedGoodsBalances];
let movements = [...mockFinishedGoodsMovements];
let movementCounter = movements.length;

function recordMovement(input: Omit<FinishedGoodsMovement, "id">): FinishedGoodsMovement {
  movementCounter += 1;
  const movement: FinishedGoodsMovement = { ...input, id: `fgm-${String(movementCounter).padStart(3, "0")}` };
  movements = [movement, ...movements];
  return movement;
}

function getOrCreateBalance(source: PackingOrder): FinishedGoodsBalance {
  const existing = balances.find((b) => b.productionOrderId === source.productionOrderId);
  if (existing) return existing;
  const created: FinishedGoodsBalance = {
    id: source.productionOrderId,
    productionOrderId: source.productionOrderId,
    productionOrderNumber: source.productionOrderNumber,
    orderId: source.orderId,
    orderNumber: source.orderNumber,
    customerId: source.customerId,
    customerName: source.customerName,
    styleId: source.styleId,
    styleCode: source.styleCode,
    styleName: source.styleName,
    colorId: source.colorId,
    colorName: source.colorName,
    skuId: source.skuId,
    unit: source.unit,
    packed: 0,
    dispatched: 0,
    reserved: 0,
    warehouseId: "wh-002",
    locationId: "loc-004",
    lastMovementDate: new Date().toISOString().slice(0, 10),
  };
  balances = [...balances, created];
  return created;
}

interface ReceiveFromPackingInput {
  packingOrder: PackingOrder;
  quantity: number;
  reference: string;
  performedBy: string;
}

interface IssueToDispatchInput {
  productionOrderId: string;
  styleCode: string;
  colorName: string;
  quantity: number;
  unit: string;
  reference: string;
  performedBy: string;
}

export const finishedGoodsService = {
  listBalances: () => delay([...balances]),
  getByProductionOrderId: (productionOrderId: string) => delay(balances.find((b) => b.productionOrderId === productionOrderId)),
  listMovements: () => delay([...movements]),
  listMovementsByProductionOrder: (productionOrderId: string) => delay(movements.filter((m) => m.productionOrderId === productionOrderId)),

  /** Posts packed pieces into Finished Goods — called every time Packing records an entry, so stock becomes available incrementally. */
  receiveFromPacking: (input: ReceiveFromPackingInput) => {
    const timestamp = new Date().toISOString();
    const target = getOrCreateBalance(input.packingOrder);
    balances = balances.map((b) => (b.productionOrderId === target.productionOrderId ? { ...b, packed: b.packed + input.quantity, lastMovementDate: timestamp.slice(0, 10) } : b));
    recordMovement({
      productionOrderId: input.packingOrder.productionOrderId,
      styleCode: input.packingOrder.styleCode,
      colorName: input.packingOrder.colorName,
      type: "receipt",
      quantity: input.quantity,
      unit: input.packingOrder.unit,
      warehouseId: target.warehouseId,
      locationId: target.locationId,
      reference: input.reference,
      performedBy: input.performedBy,
      timestamp,
    });
    return delay(balances.find((b) => b.productionOrderId === target.productionOrderId) as FinishedGoodsBalance);
  },

  /** Issues dispatched pieces out of Finished Goods — never allowed to push `dispatched` past `packed` (enforced by the caller via `getFinishedGoodsAvailable`). */
  issueToDispatch: (input: IssueToDispatchInput) => {
    const timestamp = new Date().toISOString();
    const existing = balances.find((b) => b.productionOrderId === input.productionOrderId);
    if (!existing) throw new Error(`No Finished Goods balance for production order "${input.productionOrderId}"`);
    balances = balances.map((b) => (b.productionOrderId === input.productionOrderId ? { ...b, dispatched: b.dispatched + input.quantity, lastMovementDate: timestamp.slice(0, 10) } : b));
    recordMovement({
      productionOrderId: input.productionOrderId,
      styleCode: input.styleCode,
      colorName: input.colorName,
      type: "issue",
      quantity: -input.quantity,
      unit: input.unit,
      warehouseId: existing.warehouseId,
      locationId: existing.locationId,
      reference: input.reference,
      performedBy: input.performedBy,
      timestamp,
    });
    return delay(balances.find((b) => b.productionOrderId === input.productionOrderId) as FinishedGoodsBalance);
  },
};

function useInvalidateFinishedGoods() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["finished-goods-balances"] });
    queryClient.invalidateQueries({ queryKey: ["finished-goods-movements"] });
  };
}

export const finishedGoodsHooks = {
  useList: () => useQuery({ queryKey: ["finished-goods-balances"], queryFn: finishedGoodsService.listBalances }),
  useDetail: (productionOrderId: string | undefined) =>
    useQuery({
      queryKey: ["finished-goods-balances", productionOrderId],
      queryFn: () => finishedGoodsService.getByProductionOrderId(productionOrderId as string),
      enabled: Boolean(productionOrderId),
    }),
  useMovements: () => useQuery({ queryKey: ["finished-goods-movements"], queryFn: finishedGoodsService.listMovements }),
  useMovementsByProductionOrder: (productionOrderId: string | undefined) =>
    useQuery({
      queryKey: ["finished-goods-movements", productionOrderId],
      queryFn: () => finishedGoodsService.listMovementsByProductionOrder(productionOrderId as string),
      enabled: Boolean(productionOrderId),
    }),
  useReceiveFromPacking: () => {
    const invalidate = useInvalidateFinishedGoods();
    return useMutation({ mutationFn: finishedGoodsService.receiveFromPacking, onSuccess: invalidate });
  },
  useIssueToDispatch: () => {
    const invalidate = useInvalidateFinishedGoods();
    return useMutation({ mutationFn: finishedGoodsService.issueToDispatch, onSuccess: invalidate });
  },
};
