import { daysUntil } from "@/lib/format";
import { productionStageLabels } from "@/mock-data/production";
import type {
  Order,
  OrderLineItem,
  OrderStatus,
  ProductionStageKey,
  ProductionStageProgress,
  StatusLevel,
} from "@/types";

export const productionStageOrder: ProductionStageKey[] = [
  "cutting",
  "sewing",
  "washing",
  "finishing",
  "qc",
  "packing",
  "dispatch",
];

export function lineItemTotal(item: Pick<OrderLineItem, "sizeBreakdown">): number {
  return item.sizeBreakdown.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
}

export function orderTotal(lineItems: Array<Pick<OrderLineItem, "sizeBreakdown">>): number {
  return lineItems.reduce((sum, item) => sum + lineItemTotal(item), 0);
}

/** Next sequential ORD-{year}-{00000} number, based on the highest existing sequence for the year. */
export function generateOrderNumber(existing: Order[], year = new Date().getFullYear()): string {
  const prefix = `ORD-${year}-`;
  const maxSeq = existing.reduce((max, order) => {
    if (!order.orderNumber.startsWith(prefix)) return max;
    const seq = Number(order.orderNumber.slice(prefix.length));
    return Number.isFinite(seq) ? Math.max(max, seq) : max;
  }, 0);
  return `${prefix}${String(maxSeq + 1).padStart(5, "0")}`;
}

/**
 * Visualization-only stage breakdown for an order's detail page. Distributes
 * `quantityProduced` across stages up to `currentStage` — not driven by real
 * production transactions, which arrive in a later phase.
 */
export function buildStageProgress(order: Order): ProductionStageProgress[] {
  const currentIndex = productionStageOrder.indexOf(order.currentStage);
  const isFinished = order.status === "completed" || order.status === "dispatched";
  const isCancelled = order.status === "cancelled";

  return productionStageOrder.map((stage, index) => {
    if (isCancelled) {
      return { stage, status: "blocked", completedPieces: 0, totalPieces: order.quantity };
    }
    if (isFinished || index < currentIndex) {
      return { stage, status: "done", completedPieces: order.quantity, totalPieces: order.quantity };
    }
    if (index === currentIndex) {
      return {
        stage,
        status: "in_progress",
        completedPieces: order.quantityProduced,
        totalPieces: order.quantity,
      };
    }
    return { stage, status: "pending", completedPieces: 0, totalPieces: order.quantity };
  });
}

export interface OrderAlert {
  level: StatusLevel;
  message: string;
}

const openStatuses: OrderStatus[] = ["confirmed", "in_production", "partially_completed"];

/** Derived, mock-data-driven alerts — no notification infrastructure yet. */
export function getOrderAlerts(order: Order): OrderAlert[] {
  const alerts: OrderAlert[] = [];
  const isOpen = openStatuses.includes(order.status);
  const daysLeft = daysUntil(order.dueDate);

  if (isOpen) {
    if (daysLeft < 0) {
      alerts.push({ level: "critical", message: `Delivery date passed ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"} ago` });
    } else if (daysLeft <= 7) {
      alerts.push({ level: "warning", message: `Delivery approaching — ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining` });
    }

    if (order.isDelayed) {
      alerts.push({ level: "critical", message: "Production is behind schedule" });
    }

    if (order.quantity > 0 && order.quantityProduced < order.quantity && daysLeft <= 3 && daysLeft >= 0) {
      alerts.push({ level: "warning", message: "Order has incomplete quantity with delivery imminent" });
    }
  }

  if ((order.priority === "high" || order.priority === "urgent") && isOpen) {
    alerts.push({
      level: order.priority === "urgent" ? "critical" : "warning",
      message: `${order.priority === "urgent" ? "Urgent" : "High"} priority order`,
    });
  }

  return alerts;
}

/** How much of the order form is editable, based on order lifecycle status. */
export type OrderEditTier = "full" | "limited" | "very_limited" | "readonly";

export function getOrderEditTier(status: OrderStatus): OrderEditTier {
  switch (status) {
    case "draft":
      return "full";
    case "confirmed":
      return "limited";
    case "in_production":
    case "partially_completed":
      return "very_limited";
    case "completed":
    case "dispatched":
    case "cancelled":
      return "readonly";
  }
}

/** Valid forward status transitions from the current status (excludes staying put). */
export function getNextStatusOptions(status: OrderStatus): OrderStatus[] {
  switch (status) {
    case "draft":
      return ["confirmed", "cancelled"];
    case "confirmed":
      return ["in_production", "cancelled"];
    case "in_production":
      return ["partially_completed", "completed", "cancelled"];
    case "partially_completed":
      return ["completed", "cancelled"];
    case "completed":
      return ["dispatched"];
    case "dispatched":
    case "cancelled":
      return [];
  }
}

export function stageProgressLabel(stage: ProductionStageKey): string {
  return productionStageLabels[stage] ?? stage;
}
