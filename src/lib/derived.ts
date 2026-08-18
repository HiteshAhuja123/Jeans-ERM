import {
  mockAlerts,
  mockApprovals,
  mockDailyProduction,
  mockDefects,
  mockInventoryItems,
  mockOrders,
  mockQcInspections,
} from "@/mock-data";

/**
 * Small aggregate counts derived from mock data, shared by the sidebar badges,
 * topbar notification bell and dashboard stat cards so every screen agrees.
 */
export const navBadgeCounts = {
  delayedOrders: mockOrders.filter((order) => order.isDelayed).length,
  lowStock: mockInventoryItems.filter(
    (item) => item.stockLevel === "low" || item.stockLevel === "critical" || item.stockLevel === "out_of_stock",
  ).length,
  openDefects: mockDefects.filter((defect) => defect.status === "open").length,
  pendingApprovals: mockApprovals.length,
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
