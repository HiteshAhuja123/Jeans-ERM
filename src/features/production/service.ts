import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createMasterDataHooks } from "@/lib/master-data-hooks";
import { createMasterDataService } from "@/lib/master-data-service";
import { inventoryService } from "@/features/inventory/service";
import {
  mockBoms,
  mockMaterialReservations,
  mockProductionOrders,
  mockProductionPlans,
} from "@/mock-data";
import type { Bom, MaterialReservation, ProductionOrder, ProductionPlan } from "@/types";

export const productionPlanService = createMasterDataService<ProductionPlan>(mockProductionPlans, "plan");
export const productionPlanHooks = createMasterDataHooks("production-plans", productionPlanService);

export const productionOrderService = createMasterDataService<ProductionOrder>(mockProductionOrders, "prod");
export const productionOrderHooks = createMasterDataHooks("production-orders", productionOrderService);

export const bomService = createMasterDataService<Bom>(mockBoms, "bom");
export const bomHooks = createMasterDataHooks("boms", bomService);

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

let reservations = [...mockMaterialReservations];
let reservationCounter = reservations.length;

export const materialReservationService = {
  list: () => delay([...reservations]),
  listByProductionOrder: (productionOrderId: string) =>
    delay(reservations.filter((r) => r.productionOrderId === productionOrderId)),
  create: (input: Omit<MaterialReservation, "id">) => {
    reservationCounter += 1;
    const reservation: MaterialReservation = { ...input, id: `res-${String(reservationCounter).padStart(3, "0")}` };
    reservations = [reservation, ...reservations];
    return delay(reservation);
  },
  removeByProductionOrder: (productionOrderId: string) => {
    const removed = reservations.filter((r) => r.productionOrderId === productionOrderId);
    reservations = reservations.filter((r) => r.productionOrderId !== productionOrderId);
    return delay(removed);
  },
};

export interface ReleaseProductionOrderInput {
  productionOrder: ProductionOrder;
  materials: Array<{ materialId: string; quantity: number }>;
}

/**
 * "Release" is the Phase 6 commitment point: it reserves the required materials (soft-holds
 * them against InventoryBalance, mirrored as MaterialReservation records for traceability)
 * and flips the order to Released. It does not start execution — that's a later phase.
 */
async function releaseProductionOrder({ productionOrder, materials }: ReleaseProductionOrderInput) {
  for (const material of materials) {
    if (material.quantity <= 0) continue;
    await inventoryService.reserveStock(material.materialId, material.quantity);
    await materialReservationService.create({
      productionOrderId: productionOrder.id,
      materialId: material.materialId,
      quantity: material.quantity,
      createdDate: new Date().toISOString().slice(0, 10),
    });
  }
  return productionOrderService.update(productionOrder.id, { status: "released" });
}

/** Cancelling a production order releases any material it had reserved back to available stock. */
async function cancelProductionOrder(productionOrder: ProductionOrder) {
  const existing = await materialReservationService.listByProductionOrder(productionOrder.id);
  for (const reservation of existing) {
    await inventoryService.releaseReservedStock(reservation.materialId, reservation.quantity);
  }
  await materialReservationService.removeByProductionOrder(productionOrder.id);
  return productionOrderService.update(productionOrder.id, { status: "cancelled" });
}

export const materialReservationHooks = {
  useList: () => useQuery({ queryKey: ["material-reservations"], queryFn: materialReservationService.list }),
  useByProductionOrder: (productionOrderId: string | undefined) =>
    useQuery({
      queryKey: ["material-reservations", productionOrderId],
      queryFn: () => materialReservationService.listByProductionOrder(productionOrderId as string),
      enabled: Boolean(productionOrderId),
    }),
  useReleaseProductionOrder: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: releaseProductionOrder,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["production-orders"] });
        queryClient.invalidateQueries({ queryKey: ["material-reservations"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-balances"] });
      },
    });
  },
  useCancelProductionOrder: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: cancelProductionOrder,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["production-orders"] });
        queryClient.invalidateQueries({ queryKey: ["material-reservations"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-balances"] });
      },
    });
  },
};
