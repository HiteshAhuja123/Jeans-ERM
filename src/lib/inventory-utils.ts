import type { InventoryBalance, PurchaseOrder, PurchaseOrderStatus, StatusLevel, StockLevel } from "@/types";

const openPoStatuses: PurchaseOrderStatus[] = ["approved", "sent", "partially_received"];

/**
 * On Order = outstanding (ordered - received) quantity across open purchase orders for a material.
 * Always computed live from Purchase Order data — never a stored, staleable number — so a receipt
 * immediately reduces it without a separate sync step.
 */
export function getOnOrderQuantity(materialId: string, purchaseOrders: PurchaseOrder[]): number {
  return purchaseOrders
    .filter((po) => openPoStatuses.includes(po.status))
    .flatMap((po) => po.items)
    .filter((item) => item.materialId === materialId)
    .reduce((sum, item) => sum + Math.max(0, item.quantity - item.receivedQuantity), 0);
}

/** Available Stock = On Hand - Reserved. Never entered manually — always derived. */
export function getAvailableStock(balance: Pick<InventoryBalance, "onHand" | "reserved">): number {
  return Math.max(0, balance.onHand - balance.reserved);
}

/**
 * Centralized stock status rule — the only place "healthy/low/critical/out of stock" is decided.
 * Available > Reorder Point -> Healthy. Available <= Reorder Point -> Low.
 * Available <= Minimum Stock -> Critical (a low-stock sub-tier). Available = 0 -> Out of Stock.
 */
export function getStockStatus(
  balance: Pick<InventoryBalance, "onHand" | "reserved" | "reorderPoint" | "minimumStock">,
): StockLevel {
  const available = getAvailableStock(balance);
  if (available <= 0) return "out_of_stock";
  if (available <= balance.minimumStock) return "critical";
  if (available <= balance.reorderPoint) return "low";
  return "healthy";
}

/** Estimated operational stock value — NOT an accounting valuation (no FIFO/LIFO/weighted-average). */
export function getInventoryValue(balance: Pick<InventoryBalance, "onHand" | "unitCost">): number {
  return balance.onHand * balance.unitCost;
}

export function getLocationTotal(balance: Pick<InventoryBalance, "locations">): number {
  return balance.locations.reduce((sum, loc) => sum + loc.quantity, 0);
}

export interface InventoryAlert {
  level: StatusLevel;
  message: string;
  href: string;
}
