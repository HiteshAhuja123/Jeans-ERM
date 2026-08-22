import { buildOrderActivity } from "@/mock-data/order-activity";
import { buildProductionOrderActivity } from "@/mock-data/production-activity";
import { buildCuttingOrderActivity } from "@/mock-data/cutting-activity";
import { buildSewingOrderActivity } from "@/mock-data/sewing-activity";
import { buildProcessingOrderActivity } from "@/mock-data/processing-activity";
import { buildFinishingOrderActivity } from "@/mock-data/finishing-activity";
import { buildQcOrderActivity } from "@/mock-data/qc-activity";
import { buildPackingOrderActivity } from "@/mock-data/packing-activity";
import { buildDispatchOrderActivity } from "@/mock-data/dispatch-activity";
import type { ActivityItem } from "@/types";
import {
  mockBundles,
  mockCuttingBatches,
  mockCuttingOrders,
  mockCuttingOutputs,
  mockDispatchOrders,
  mockFabricAllocations,
  mockFabricIssues,
  mockFinishingEntries,
  mockFinishingOrders,
  mockMaterialReturns,
  mockOrders,
  mockPackingEntries,
  mockPackingOrders,
  mockProcessingOrders,
  mockProcessingTransactions,
  mockProductionOrders,
  mockQcInspectionEntries,
  mockQcOrders,
  mockQcReworks,
  mockSewingOrderBundles,
  mockSewingOrders,
  mockSewingProductionEntries,
  mockSewingReworks,
} from "@/mock-data";

/**
 * A single "who did what when" feed across every stage, built by calling each stage's own
 * `build<X>Activity` function (the pattern every phase already uses on its own detail pages) and
 * merging the results — no separate audit log is stored, and no per-stage logic is duplicated.
 */
export function getGlobalActivityFeed(limit = 30): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const order of mockOrders) {
    for (const entry of buildOrderActivity(order)) {
      items.push({ id: `order-${entry.id}`, actor: entry.actor, action: entry.action, target: order.orderNumber, timestamp: entry.timestamp });
    }
  }

  for (const po of mockProductionOrders) {
    for (const entry of buildProductionOrderActivity(po)) {
      items.push({ id: `po-${entry.id}`, actor: entry.actor, action: entry.action, target: po.productionOrderNumber, timestamp: entry.timestamp });
    }
  }

  for (const order of mockCuttingOrders) {
    const activity = buildCuttingOrderActivity(order, mockFabricAllocations, mockFabricIssues, mockCuttingBatches, mockCuttingOutputs, mockBundles, mockMaterialReturns);
    for (const entry of activity) {
      items.push({ id: `cut-${entry.id}`, actor: entry.actor, action: entry.action, target: order.cuttingOrderNumber, timestamp: entry.timestamp });
    }
  }

  for (const order of mockSewingOrders) {
    const activity = buildSewingOrderActivity(order, mockSewingOrderBundles, mockSewingProductionEntries, mockSewingReworks);
    for (const entry of activity) {
      items.push({ id: `sew-${entry.id}`, actor: entry.actor, action: entry.action, target: order.sewingOrderNumber, timestamp: entry.timestamp });
    }
  }

  for (const order of mockProcessingOrders) {
    for (const entry of buildProcessingOrderActivity(order, mockProcessingTransactions)) {
      items.push({ id: `proc-${entry.id}`, actor: entry.actor, action: entry.action, target: order.processingOrderNumber, timestamp: entry.timestamp });
    }
  }

  for (const order of mockFinishingOrders) {
    for (const entry of buildFinishingOrderActivity(order, mockFinishingEntries)) {
      items.push({ id: `fin-${entry.id}`, actor: entry.actor, action: entry.action, target: order.finishingOrderNumber, timestamp: entry.timestamp });
    }
  }

  for (const order of mockQcOrders) {
    for (const entry of buildQcOrderActivity(order, mockQcInspectionEntries, mockQcReworks)) {
      items.push({ id: `qc-${entry.id}`, actor: entry.actor, action: entry.action, target: order.qcOrderNumber, timestamp: entry.timestamp });
    }
  }

  for (const order of mockPackingOrders) {
    for (const entry of buildPackingOrderActivity(order, mockPackingEntries)) {
      items.push({ id: `pack-${entry.id}`, actor: entry.actor, action: entry.action, target: order.packingOrderNumber, timestamp: entry.timestamp });
    }
  }

  for (const order of mockDispatchOrders) {
    for (const entry of buildDispatchOrderActivity(order)) {
      items.push({ id: `disp-${entry.id}`, actor: entry.actor, action: entry.action, target: order.dispatchOrderNumber, timestamp: entry.timestamp });
    }
  }

  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit);
}
