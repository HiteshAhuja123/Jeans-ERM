import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { mockInventoryBalances, mockStockMovements } from "@/mock-data";
import type { InventoryBalance, InventoryLocationStock, StockMovement } from "@/types";

/**
 * Hand-rolled in-memory service for inventory balances + stock movements — not built on
 * `createMasterDataService` because balance changes are always domain-specific mutations
 * (receive / adjust / transfer), never a generic create/update, and every mutation must
 * also append a StockMovement record ("never silently overwrite stock").
 */
function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

let balances = [...mockInventoryBalances];
let movements = [...mockStockMovements];
let movementCounter = movements.length;

function recordMovement(input: Omit<StockMovement, "id">): StockMovement {
  movementCounter += 1;
  const movement: StockMovement = { ...input, id: `mov-${String(movementCounter).padStart(3, "0")}` };
  movements = [movement, ...movements];
  return movement;
}

function applyLocationDelta(
  locations: InventoryLocationStock[],
  warehouseId: string,
  locationId: string,
  delta: number,
): InventoryLocationStock[] {
  const existing = locations.find((loc) => loc.warehouseId === warehouseId && loc.locationId === locationId);
  const next = existing
    ? locations.map((loc) => (loc === existing ? { ...loc, quantity: loc.quantity + delta } : loc))
    : delta > 0
      ? [...locations, { warehouseId, locationId, quantity: delta }]
      : locations;
  return next.filter((loc) => loc.quantity > 0);
}

function getOrCreateBalance(materialId: string): InventoryBalance {
  const existing = balances.find((balance) => balance.materialId === materialId);
  if (existing) return existing;
  const created: InventoryBalance = {
    id: materialId,
    materialId,
    onHand: 0,
    reserved: 0,
    rejected: 0,
    reorderPoint: 0,
    minimumStock: 0,
    unitCost: 0,
    locations: [],
    lastMovementDate: new Date().toISOString().slice(0, 10),
  };
  balances = [...balances, created];
  return created;
}

function updateBalance(materialId: string, patch: (balance: InventoryBalance) => InventoryBalance): InventoryBalance {
  getOrCreateBalance(materialId);
  let updated: InventoryBalance | undefined;
  balances = balances.map((balance) => {
    if (balance.materialId !== materialId) return balance;
    updated = patch(balance);
    return updated;
  });
  return updated as InventoryBalance;
}

interface ReceiveStockInput {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  warehouseId: string;
  locationId: string;
  reference: string;
  performedBy: string;
}

interface AdjustStockInput {
  materialId: string;
  materialName: string;
  warehouseId: string;
  locationId: string;
  /** Signed — positive increases on-hand, negative decreases it. */
  delta: number;
  unit: string;
  reason: string;
  performedBy: string;
}

interface TransferStockInput {
  materialId: string;
  materialName: string;
  fromWarehouseId: string;
  fromLocationId: string;
  toWarehouseId: string;
  toLocationId: string;
  quantity: number;
  unit: string;
  reason?: string;
  performedBy: string;
}

export const inventoryService = {
  listBalances: () => delay([...balances]),

  /** Soft-holds material against a future consumption — no physical movement, so no StockMovement is logged. */
  reserveStock: (materialId: string, quantity: number) => {
    const updated = updateBalance(materialId, (balance) => ({ ...balance, reserved: balance.reserved + quantity }));
    return delay(updated);
  },

  releaseReservedStock: (materialId: string, quantity: number) => {
    const updated = updateBalance(materialId, (balance) => ({
      ...balance,
      reserved: Math.max(0, balance.reserved - quantity),
    }));
    return delay(updated);
  },
  getBalanceByMaterialId: (materialId: string) => delay(balances.find((balance) => balance.materialId === materialId)),
  listMovements: () => delay([...movements]),
  listMovementsByMaterial: (materialId: string) =>
    delay(movements.filter((movement) => movement.materialId === materialId)),

  receiveStock: (input: ReceiveStockInput) => {
    const timestamp = new Date().toISOString();
    const updated = updateBalance(input.materialId, (balance) => ({
      ...balance,
      onHand: balance.onHand + input.quantity,
      locations: applyLocationDelta(balance.locations, input.warehouseId, input.locationId, input.quantity),
      lastMovementDate: timestamp.slice(0, 10),
    }));
    recordMovement({
      materialId: input.materialId,
      materialName: input.materialName,
      type: "receipt",
      quantity: input.quantity,
      unit: input.unit,
      toWarehouseId: input.warehouseId,
      toLocationId: input.locationId,
      reference: input.reference,
      performedBy: input.performedBy,
      timestamp,
    });
    return delay(updated);
  },

  adjustStock: (input: AdjustStockInput) => {
    const timestamp = new Date().toISOString();
    const updated = updateBalance(input.materialId, (balance) => ({
      ...balance,
      onHand: Math.max(0, balance.onHand + input.delta),
      locations: applyLocationDelta(balance.locations, input.warehouseId, input.locationId, input.delta),
      lastMovementDate: timestamp.slice(0, 10),
    }));
    recordMovement({
      materialId: input.materialId,
      materialName: input.materialName,
      type: "adjustment",
      quantity: input.delta,
      unit: input.unit,
      fromWarehouseId: input.delta < 0 ? input.warehouseId : undefined,
      fromLocationId: input.delta < 0 ? input.locationId : undefined,
      toWarehouseId: input.delta > 0 ? input.warehouseId : undefined,
      toLocationId: input.delta > 0 ? input.locationId : undefined,
      reason: input.reason,
      performedBy: input.performedBy,
      timestamp,
    });
    return delay(updated);
  },

  /** Moves stock between locations only — total on-hand quantity never changes. */
  transferStock: (input: TransferStockInput) => {
    const timestamp = new Date().toISOString();
    const updated = updateBalance(input.materialId, (balance) => ({
      ...balance,
      locations: applyLocationDelta(
        applyLocationDelta(balance.locations, input.fromWarehouseId, input.fromLocationId, -input.quantity),
        input.toWarehouseId,
        input.toLocationId,
        input.quantity,
      ),
      lastMovementDate: timestamp.slice(0, 10),
    }));
    recordMovement({
      materialId: input.materialId,
      materialName: input.materialName,
      type: "transfer",
      quantity: input.quantity,
      unit: input.unit,
      fromWarehouseId: input.fromWarehouseId,
      fromLocationId: input.fromLocationId,
      toWarehouseId: input.toWarehouseId,
      toLocationId: input.toLocationId,
      reason: input.reason,
      performedBy: input.performedBy,
      timestamp,
    });
    return delay(updated);
  },
};

function useInvalidateInventory() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["inventory-balances"] });
    queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
  };
}

export const inventoryHooks = {
  useList: () => useQuery({ queryKey: ["inventory-balances"], queryFn: inventoryService.listBalances }),
  useDetail: (materialId: string | undefined) =>
    useQuery({
      queryKey: ["inventory-balances", materialId],
      queryFn: () => inventoryService.getBalanceByMaterialId(materialId as string),
      enabled: Boolean(materialId),
    }),
  useMovements: () => useQuery({ queryKey: ["stock-movements"], queryFn: inventoryService.listMovements }),
  useMovementsByMaterial: (materialId: string | undefined) =>
    useQuery({
      queryKey: ["stock-movements", materialId],
      queryFn: () => inventoryService.listMovementsByMaterial(materialId as string),
      enabled: Boolean(materialId),
    }),
  useReceiveStock: () => {
    const invalidate = useInvalidateInventory();
    return useMutation({ mutationFn: inventoryService.receiveStock, onSuccess: invalidate });
  },
  useAdjustStock: () => {
    const invalidate = useInvalidateInventory();
    return useMutation({ mutationFn: inventoryService.adjustStock, onSuccess: invalidate });
  },
  useTransferStock: () => {
    const invalidate = useInvalidateInventory();
    return useMutation({ mutationFn: inventoryService.transferStock, onSuccess: invalidate });
  },
  useReserveStock: () => {
    const invalidate = useInvalidateInventory();
    return useMutation({
      mutationFn: ({ materialId, quantity }: { materialId: string; quantity: number }) =>
        inventoryService.reserveStock(materialId, quantity),
      onSuccess: invalidate,
    });
  },
  useReleaseReservedStock: () => {
    const invalidate = useInvalidateInventory();
    return useMutation({
      mutationFn: ({ materialId, quantity }: { materialId: string; quantity: number }) =>
        inventoryService.releaseReservedStock(materialId, quantity),
      onSuccess: invalidate,
    });
  },
};
