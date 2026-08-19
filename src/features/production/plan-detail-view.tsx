"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ClipboardX } from "lucide-react";

import { DetailHeader } from "@/components/shared/detail-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { orderPriorityMeta, productionOrderStatusMeta, productionPlanStatusMeta } from "@/lib/status";
import {
  computeMaterialRequirements,
  getDeliveryRisk,
  getMaterialAvailability,
  materialAvailabilityMeta,
} from "@/lib/production-utils";
import { bomHooks, productionOrderHooks, productionPlanHooks } from "@/features/production/service";
import { orderHooks } from "@/features/orders/service";
import { inventoryHooks } from "@/features/inventory/service";
import { purchaseOrderHooks } from "@/features/purchasing/service";
import { productionLineHooks } from "@/features/production-lines/service";

export function PlanDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: plan, isLoading } = productionPlanHooks.useDetail(id);
  const { data: productionOrders = [] } = productionOrderHooks.useList();
  const { data: orders = [] } = orderHooks.useList();
  const { data: lines = [] } = productionLineHooks.useList();
  const { data: boms = [] } = bomHooks.useList();
  const { data: balances = [] } = inventoryHooks.useList();
  const { data: purchaseOrders = [] } = purchaseOrderHooks.useList();

  const planOrders = useMemo(() => productionOrders.filter((po) => po.planId === id), [productionOrders, id]);

  const readiness = useMemo(() => {
    return planOrders.map((po) => {
      const bom = boms.find((b) => b.styleId === po.styleId);
      const materialLines = computeMaterialRequirements(po.quantity, bom, balances, purchaseOrders);
      const availability = getMaterialAvailability(materialLines);
      const order = orders.find((o) => o.id === po.orderId);
      const deliveryRisk = order ? getDeliveryRisk(po, order) : undefined;
      return { po, availability, deliveryRisk };
    });
  }, [planOrders, boms, balances, purchaseOrders, orders]);

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

  if (!plan) {
    return (
      <EmptyState
        icon={ClipboardX}
        title="Production plan not found"
        description="This plan may have been removed."
        action={{ label: "Back to Production Orders", onClick: () => router.push("/production/orders") }}
      />
    );
  }

  const statusMeta = productionPlanStatusMeta[plan.status];
  const totalQty = planOrders.reduce((sum, po) => sum + po.quantity, 0);
  const shortageCount = readiness.filter((r) => r.availability === "shortage" || r.availability === "partial").length;
  const risksCount = readiness.filter((r) => r.deliveryRisk?.atRisk).length;
  const linesUsed = new Set(planOrders.map((po) => po.productionLineId).filter(Boolean)).size;

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/production/orders"
        backLabel="Back to Production Orders"
        title={plan.planNumber}
        subtitle={`${formatDate(plan.periodStart)} – ${formatDate(plan.periodEnd)} · Planner ${plan.planner}`}
        statusLabel={statusMeta.label}
        statusLevel={statusMeta.level}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="flex flex-col gap-1 p-4">
          <span className="text-xs text-muted-foreground">Production Orders</span>
          <span className="text-2xl font-semibold tabular-nums text-foreground">{planOrders.length}</span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="text-xs text-muted-foreground">Total Quantity</span>
          <span className="text-2xl font-semibold tabular-nums text-foreground">{totalQty.toLocaleString()}</span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="text-xs text-muted-foreground">Material Concerns</span>
          <span className="text-2xl font-semibold tabular-nums text-foreground">{shortageCount}</span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="text-xs text-muted-foreground">Lines Involved</span>
          <span className="text-2xl font-semibold tabular-nums text-foreground">{linesUsed}</span>
        </Card>
      </div>

      {plan.notes && (
        <Card className="p-4 text-sm text-foreground">{plan.notes}</Card>
      )}

      {risksCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-critical/25 bg-critical-subtle px-3 py-2 text-sm text-critical">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          {risksCount} production order{risksCount === 1 ? "" : "s"} in this plan may miss the customer&apos;s delivery date.
        </div>
      )}

      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-foreground">Production Orders</span>
        {readiness.length === 0 ? (
          <EmptyState icon={ClipboardX} title="No production orders yet" description="This plan doesn't contain any production orders." />
        ) : (
          readiness.map(({ po, availability, deliveryRisk }) => {
            const meta = productionOrderStatusMeta[po.status];
            const priorityMeta = orderPriorityMeta[po.priority];
            const materialMeta = materialAvailabilityMeta[availability];
            const line = lines.find((l) => l.id === po.productionLineId);
            return (
              <Card
                key={po.id}
                className="flex cursor-pointer flex-col gap-2 p-4 hover:border-primary/40"
                onClick={() => router.push(`/production/orders/${po.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{po.productionOrderNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      {po.customerName} · {po.styleCode} · {po.colorName}
                    </span>
                  </div>
                  <StatusBadge label={meta.label} level={meta.level} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{po.quantity.toLocaleString()} pcs</span>
                  <span>·</span>
                  <span>{line?.name ?? "Unassigned"}</span>
                  <span>·</span>
                  <span>
                    {formatDate(po.plannedStart)} – {formatDate(po.plannedEnd)}
                  </span>
                  <StatusBadge label={priorityMeta.label} level={priorityMeta.level} hideIcon />
                  <StatusBadge label={materialMeta.label} level={materialMeta.level} hideIcon />
                  {deliveryRisk?.atRisk && (
                    <span className="flex items-center gap-1 text-critical">
                      <AlertTriangle className="size-3.5" aria-hidden="true" /> Delivery risk
                    </span>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
