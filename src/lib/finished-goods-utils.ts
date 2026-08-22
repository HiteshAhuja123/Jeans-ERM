import type { FinishedGoodsBalance, StockLevel } from "@/types";

/** On Hand = Packed - Dispatched. Never entered manually — always derived from the movement ledger. */
export function getFinishedGoodsOnHand(balance: Pick<FinishedGoodsBalance, "packed" | "dispatched">): number {
  return Math.max(0, balance.packed - balance.dispatched);
}

/** Available to dispatch = On Hand - Reserved. Never more than what's physically on hand. */
export function getFinishedGoodsAvailable(balance: Pick<FinishedGoodsBalance, "packed" | "dispatched" | "reserved">): number {
  return Math.max(0, getFinishedGoodsOnHand(balance) - balance.reserved);
}

/** Reuses the same healthy/low/critical/out_of_stock vocabulary as raw-material inventory, but against 0 (no reorder point concept for FG yet). */
export function getFinishedGoodsStockLevel(balance: Pick<FinishedGoodsBalance, "packed" | "dispatched" | "reserved">): StockLevel {
  const available = getFinishedGoodsAvailable(balance);
  if (available <= 0) return "out_of_stock";
  return "healthy";
}
