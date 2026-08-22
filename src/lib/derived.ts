import { getAvailableFabric, getMaterialReadiness } from "@/lib/cutting-utils";
import { getStockStatus } from "@/lib/inventory-utils";
import { getPendingReworkQuantity, isSewingOrderDelayed } from "@/lib/sewing-utils";
import { getQcPendingReworkQuantity } from "@/lib/post-sewing-utils";
import {
  mockAlerts,
  mockApprovals,
  mockCuttingOrders,
  mockDailyProduction,
  mockDefects,
  mockFinishingOrders,
  mockInventoryBalances,
  mockOrders,
  mockPackingOrders,
  mockProcessingOrders,
  mockProductionOrders,
  mockPurchaseOrders,
  mockQcInspections,
  mockQcOrders,
  mockQcReworks,
  mockSewingOrders,
  mockSewingReworks,
} from "@/mock-data";

const activeProductionStatuses = ["draft", "planned", "released", "in_progress", "on_hold", "partially_completed"];
const notStartedCuttingStatuses = ["pending", "material_check", "ready"];
const todayDate = new Date().toISOString().slice(0, 10);

/**
 * Small aggregate counts derived from mock data, shared by the sidebar badges,
 * topbar notification bell and dashboard stat cards so every screen agrees.
 */
export const navBadgeCounts = {
  delayedOrders: mockOrders.filter((order) => order.isDelayed).length,
  lowStock: mockInventoryBalances.filter((balance) => {
    const level = getStockStatus(balance);
    return level === "low" || level === "critical" || level === "out_of_stock";
  }).length,
  openDefects: mockDefects.filter((defect) => defect.status === "open").length,
  pendingApprovals: mockApprovals.length,
  openPurchaseOrders: mockPurchaseOrders.filter((po) =>
    ["pending_approval", "approved", "sent", "partially_received"].includes(po.status),
  ).length,
  productionAlerts: mockProductionOrders.filter(
    (po) => activeProductionStatuses.includes(po.status) && (po.status === "on_hold" || !po.productionLineId),
  ).length,
  cuttingAlerts: mockCuttingOrders.filter((order) => {
    if (order.status === "on_hold") return true;
    if (order.plannedEnd && order.plannedEnd < todayDate && !["completed", "cancelled"].includes(order.status)) return true;
    if (notStartedCuttingStatuses.includes(order.status)) {
      const balance = mockInventoryBalances.find((b) => b.materialId === order.materialId);
      return getMaterialReadiness(order.fabricRequired, getAvailableFabric(balance)) === "shortage";
    }
    return false;
  }).length,
  sewingAlerts: mockSewingOrders.filter((order) => {
    if (order.status === "on_hold") return true;
    if (isSewingOrderDelayed(order, todayDate)) return true;
    return getPendingReworkQuantity(order.id, mockSewingReworks) > 0;
  }).length,
  processingAlerts: mockProcessingOrders.filter((order) => {
    if (order.status === "on_hold") return true;
    if (order.plannedEnd && order.plannedEnd < todayDate && !["completed", "cancelled"].includes(order.status)) return true;
    return false;
  }).length,
  finishingAlerts: mockFinishingOrders.filter((order) => {
    if (order.status === "on_hold") return true;
    if (order.plannedEnd && order.plannedEnd < todayDate && !["completed", "cancelled"].includes(order.status)) return true;
    return false;
  }).length,
  qcAlerts: mockQcOrders.filter((order) => {
    if (order.status === "on_hold" || order.status === "pending_approval") return true;
    return getQcPendingReworkQuantity(order.id, mockQcReworks) > 0;
  }).length,
  packingAlerts: mockPackingOrders.filter((order) => {
    if (order.status === "on_hold") return true;
    if (order.plannedEnd && order.plannedEnd < todayDate && !["packed", "cancelled"].includes(order.status)) return true;
    return false;
  }).length,
};

export const notificationCount = mockAlerts.length;

const today = mockDailyProduction[mockDailyProduction.length - 1];
const totalInspected = mockQcInspections.reduce((sum, i) => sum + i.inspectedQty, 0);
const totalPassed = mockQcInspections.reduce((sum, i) => sum + i.passedQty, 0);

export const dashboardMetrics = {
  todaysProduction: { completed: today.completed, target: today.target },
  activeOrders: mockOrders.filter((o) =>
    ["confirmed", "in_production", "partially_completed"].includes(o.status),
  ).length,
  delayedOrders: navBadgeCounts.delayedOrders,
  lowStockItems: navBadgeCounts.lowStock,
  qcPassRate: Math.round((totalPassed / totalInspected) * 1000) / 10,
  openQcIssues: navBadgeCounts.openDefects,
  pendingApprovals: navBadgeCounts.pendingApprovals,
};
