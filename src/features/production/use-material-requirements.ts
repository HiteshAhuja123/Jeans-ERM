"use client";

import { computeMaterialRequirements } from "@/lib/production-utils";
import { bomHooks } from "@/features/production/service";
import { inventoryHooks } from "@/features/inventory/service";
import { purchaseOrderHooks } from "@/features/purchasing/service";

export function useMaterialRequirements(styleId: string | undefined, quantity: number) {
  const { data: boms = [] } = bomHooks.useList();
  const { data: balances = [] } = inventoryHooks.useList();
  const { data: purchaseOrders = [] } = purchaseOrderHooks.useList();

  const bom = styleId ? boms.find((b) => b.styleId === styleId) : undefined;
  const lines = computeMaterialRequirements(quantity, bom, balances, purchaseOrders);

  return { bom, lines };
}
