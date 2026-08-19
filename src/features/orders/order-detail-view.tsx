"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, FileText, Info, PackageX } from "lucide-react";

import { DetailHeader } from "@/components/shared/detail-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LabeledProgress } from "@/components/shared/labeled-progress";
import { ProductionStepper } from "@/components/shared/production-stepper";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";
import { buildStageProgress, getOrderAlerts, getOrderEditTier } from "@/lib/order-utils";
import { orderPriorityMeta, orderStatusMeta, productionOrderStatusMeta } from "@/lib/status";
import { cn } from "@/lib/utils";
import { buildOrderActivity } from "@/mock-data/order-activity";
import { OrderQuickEditSheet } from "@/features/orders/order-quick-edit-sheet";
import { OrderStatusMenu } from "@/features/orders/order-status-menu";
import { orderHooks } from "@/features/orders/service";
import { useDuplicateOrder } from "@/features/orders/use-duplicate-order";
import { sizeHooks } from "@/features/sizes/service";
import { productionOrderHooks } from "@/features/production/service";
import type { StatusLevel } from "@/types";

const alertBoxClasses: Record<StatusLevel, string> = {
  critical: "border-critical/25 bg-critical-subtle text-critical",
  warning: "border-warning/25 bg-warning-subtle text-warning",
  info: "border-info/25 bg-info-subtle text-info",
  success: "border-success/25 bg-success-subtle text-success",
  neutral: "border-border bg-muted text-muted-foreground",
};

export function OrderDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: order, isLoading } = orderHooks.useDetail(id);
  const { data: sizes = [] } = sizeHooks.useList();
  const { data: allProductionOrders = [] } = productionOrderHooks.useList();
  const { duplicate, isDuplicating } = useDuplicateOrder();
  const [quickEditOpen, setQuickEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-64" />
        <Card className="p-5">
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState
        icon={PackageX}
        title="Order not found"
        description="This order may have been removed."
        action={{ label: "Back to Orders", onClick: () => router.push("/orders") }}
      />
    );
  }

  const statusMeta = orderStatusMeta[order.status];
  const priorityMeta = orderPriorityMeta[order.priority];
  const editTier = getOrderEditTier(order.status);
  const alerts = getOrderAlerts(order);
  const stages = buildStageProgress(order);
  const activity = buildOrderActivity(order);
  const productionOrders = allProductionOrders.filter((po) => po.orderId === order.id);
  const pending = Math.max(0, order.quantity - order.quantityProduced);

  function handleEdit() {
    if (editTier === "very_limited") {
      setQuickEditOpen(true);
    } else if (editTier === "full" || editTier === "limited") {
      router.push(`/orders/${id}/edit`);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/orders"
        backLabel="Back to Orders"
        title={order.orderNumber}
        subtitle={`${order.customerName} · ${order.lineItems.length} style${order.lineItems.length === 1 ? "" : "s"} · Due ${formatDate(order.dueDate)}`}
        statusLabel={statusMeta.label}
        statusLevel={statusMeta.level}
        onEdit={editTier === "readonly" ? undefined : handleEdit}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => duplicate(order)}
              disabled={isDuplicating}
            >
              Duplicate
            </Button>
            <OrderStatusMenu order={order} />
          </>
        }
        tabs={
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="items">Items ({order.lineItems.length})</TabsTrigger>
              <TabsTrigger value="production">Production</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
              {alerts.length > 0 && (
                <div className="flex flex-col gap-2">
                  {alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                        alertBoxClasses[alert.level],
                      )}
                    >
                      <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                      {alert.message}
                    </div>
                  ))}
                </div>
              )}

              <Card className="flex flex-col gap-3 p-5">
                <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Ordered</span>
                    <span className="text-lg font-semibold text-foreground tabular-nums">
                      {order.quantity.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Completed</span>
                    <span className="text-lg font-semibold text-foreground tabular-nums">
                      {order.quantityProduced.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Pending</span>
                    <span className="text-lg font-semibold text-foreground tabular-nums">
                      {pending.toLocaleString()}
                    </span>
                  </div>
                </div>
                <LabeledProgress
                  label="Production Progress"
                  current={order.quantityProduced}
                  total={order.quantity}
                  level={order.isDelayed ? "critical" : "info"}
                />
              </Card>

              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Customer</span>
                  <span className="text-sm font-medium text-foreground">{order.customerName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Order Date</span>
                  <span className="text-sm font-medium text-foreground">{formatDate(order.orderDate)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Delivery Date</span>
                  <span className="text-sm font-medium text-foreground">{formatDate(order.dueDate)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Priority</span>
                  <StatusBadge label={priorityMeta.label} level={priorityMeta.level} hideIcon />
                </div>
                {order.customerReference && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Customer Reference</span>
                    <span className="text-sm font-medium text-foreground">{order.customerReference}</span>
                  </div>
                )}
                {order.deliveryLocation && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Delivery Location</span>
                    <span className="text-sm font-medium text-foreground">{order.deliveryLocation}</span>
                  </div>
                )}
                {order.shippingInstructions && (
                  <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-3">
                    <span className="text-xs text-muted-foreground">Shipping Instructions</span>
                    <span className="text-sm text-foreground">{order.shippingInstructions}</span>
                  </div>
                )}
                {order.notes && (
                  <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-3">
                    <span className="text-xs text-muted-foreground">Notes</span>
                    <span className="text-sm text-foreground">{order.notes}</span>
                  </div>
                )}
                {order.internalNotes && (
                  <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-3">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Info className="size-3" aria-hidden="true" /> Internal Notes
                    </span>
                    <span className="text-sm text-foreground">{order.internalNotes}</span>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="items" className="mt-4 flex flex-col gap-3">
              {order.lineItems.map((item) => (
                <Card key={item.id} className="flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">
                        {item.styleCode} · {item.styleName}
                      </span>
                      <span className="text-xs text-muted-foreground">{item.colorName}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {item.quantity.toLocaleString()} pcs
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {item.sizeBreakdown.map((entry) => (
                      <div
                        key={entry.sizeId}
                        className="flex flex-col items-center gap-0.5 rounded-lg border border-border bg-muted/40 px-2 py-1.5"
                      >
                        <span className="text-[11px] text-muted-foreground">
                          {sizes.find((s) => s.id === entry.sizeId)?.displayName ?? "—"}
                        </span>
                        <span className="text-sm font-medium tabular-nums text-foreground">
                          {entry.quantity.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="production" className="mt-4 flex flex-col gap-4">
              <Card className="overflow-x-auto p-5">
                <ProductionStepper stages={stages} />
              </Card>

              {productionOrders.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-foreground">Production Orders</span>
                  {productionOrders.map((po) => {
                    const meta = productionOrderStatusMeta[po.status];
                    return (
                      <Card
                        key={po.id}
                        className="flex cursor-pointer items-center justify-between p-4 hover:border-primary/40"
                        onClick={() => router.push(`/production/orders/${po.id}`)}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{po.productionOrderNumber}</span>
                          <span className="text-xs text-muted-foreground">
                            {po.styleCode} · {po.colorName} · {po.quantity.toLocaleString()} pcs
                          </span>
                        </div>
                        <StatusBadge label={meta.label} level={meta.level} />
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              {activity.length === 0 ? (
                <EmptyState icon={FileText} title="No activity yet" description="Changes to this order will appear here." />
              ) : (
                <div className="flex flex-col gap-3">
                  {activity.map((entry) => (
                    <Card key={entry.id} className="flex items-start justify-between gap-3 p-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">{entry.action}</span>
                        <span className="text-xs text-muted-foreground">{entry.actor}</span>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDate(entry.timestamp)}</span>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <EmptyState
                icon={FileText}
                title="Documents coming soon"
                description="Packing lists, invoices and shipping documents will appear here in a later phase."
              />
            </TabsContent>
          </Tabs>
        }
      />

      <OrderQuickEditSheet open={quickEditOpen} onOpenChange={setQuickEditOpen} order={order} />
    </div>
  );
}
