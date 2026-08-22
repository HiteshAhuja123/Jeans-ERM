import type { AlertItem, InventoryBalance, Material, Order, PackingOrder, ProductionOrder, QcOrder } from "@/types";
import { getAvailableStock, getStockStatus } from "@/lib/inventory-utils";
import { getOrdersApproachingDeadline, getProductionInsights } from "@/lib/insights-utils";

/**
 * Real, live operational alerts — computed from current data every time it's called, never
 * stored. Replaces the old static `mockAlerts` seed as the feed for both the topbar notification
 * bell and the dashboard Alerts card, so what a user sees always matches the underlying records.
 */
export function getOperationalAlerts(data: {
  inventoryBalances: InventoryBalance[];
  materials: Material[];
  productionOrders: ProductionOrder[];
  qcOrders: QcOrder[];
  orders: Order[];
  packingOrders: PackingOrder[];
  today: string;
}): AlertItem[] {
  const alerts: AlertItem[] = [];

  for (const balance of data.inventoryBalances) {
    const level = getStockStatus(balance);
    if (level !== "critical" && level !== "out_of_stock") continue;
    const material = data.materials.find((m) => m.id === balance.materialId);
    alerts.push({
      id: `alert-stock-${balance.materialId}`,
      level: level === "out_of_stock" ? "critical" : "warning",
      title: `${material?.name ?? balance.materialId} ${level === "out_of_stock" ? "is out of stock" : "critically low"}`,
      description: `${getAvailableStock(balance).toLocaleString()} available — reorder point is ${balance.reorderPoint.toLocaleString()}`,
      module: "Inventory",
      timestamp: balance.lastMovementDate || data.today,
      href: `/inventory/stock/${balance.materialId}`,
    });
  }

  const { delayed } = getProductionInsights(data.productionOrders, data.today, data.today);
  for (const po of delayed) {
    alerts.push({
      id: `alert-production-delay-${po.id}`,
      level: "critical",
      title: `${po.productionOrderNumber} is behind schedule`,
      description: `${po.styleCode} · ${po.colorName} for ${po.customerName} — planned end ${po.plannedEnd} has passed`,
      module: "Production",
      timestamp: po.plannedEnd,
      href: `/production/orders/${po.id}`,
    });
  }

  for (const qc of data.qcOrders) {
    if (qc.status !== "on_hold") continue;
    alerts.push({
      id: `alert-qc-hold-${qc.id}`,
      level: "warning",
      title: `${qc.qcOrderNumber} is on hold`,
      description: qc.holdReason ?? `Inspection paused for ${qc.styleCode} · ${qc.colorName}`,
      module: "Quality",
      timestamp: qc.actualStart ?? qc.createdDate,
      href: `/quality/${qc.id}`,
    });
  }

  for (const p of data.packingOrders) {
    if (p.status !== "on_hold") continue;
    alerts.push({
      id: `alert-packing-hold-${p.id}`,
      level: "warning",
      title: `${p.packingOrderNumber} is on hold`,
      description: p.holdReason ?? `Packing paused for ${p.styleCode} · ${p.colorName}`,
      module: "Packing",
      timestamp: p.actualStart ?? p.createdDate,
      href: `/packing/${p.id}`,
    });
  }

  for (const order of getOrdersApproachingDeadline(data.orders, data.today, 3)) {
    alerts.push({
      id: `alert-order-deadline-${order.id}`,
      level: order.dueDate === data.today ? "critical" : "warning",
      title: `${order.orderNumber} is due ${order.dueDate === data.today ? "today" : "soon"}`,
      description: `${order.customerName} — due ${order.dueDate}`,
      module: "Orders",
      timestamp: order.dueDate,
      href: `/orders/${order.id}`,
    });
  }

  return alerts.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
