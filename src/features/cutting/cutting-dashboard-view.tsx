"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, Boxes, CheckCircle2, Layers, ListChecks, Loader2, PackageCheck, Scissors, Target } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import { cuttingOrderStatusMeta, orderPriorityMeta } from "@/lib/status";
import {
  getAvailableFabric,
  getAvailableForBundling,
  getCuttingOrderCutQuantity,
  getFabricReconciliation,
  getMaterialReadiness,
} from "@/lib/cutting-utils";
import { bundleHooks } from "@/features/cutting/bundle-service";
import { cuttingBatchHooks, cuttingOrderHooks, cuttingOutputHooks, fabricIssueHooks, materialReturnHooks } from "@/features/cutting/service";
import { inventoryHooks } from "@/features/inventory/service";
import type { CuttingOrder, StatusLevel } from "@/types";

const activeStatuses: CuttingOrder["status"][] = ["pending", "material_check", "ready"];

export function CuttingDashboardView() {
  const { data: orders = [], isLoading } = cuttingOrderHooks.useList();
  const { data: batches = [] } = cuttingBatchHooks.useList();
  const { data: outputs = [] } = cuttingOutputHooks.useList();
  const { data: bundles = [] } = bundleHooks.useList();
  const { data: fabricIssues = [] } = fabricIssueHooks.useList();
  const { data: materialReturns = [] } = materialReturnHooks.useList();
  const { data: balances = [] } = inventoryHooks.useList();

  const today = new Date().toISOString().slice(0, 10);

  const metrics = useMemo(() => {
    const pending = orders.filter((o) => activeStatuses.includes(o.status));
    const inProgress = orders.filter((o) => o.status === "in_progress");
    const completed = orders.filter((o) => o.status === "completed");
    const onHold = orders.filter((o) => o.status === "on_hold");

    const todaysPlanned = batches.filter((b) => b.status === "in_progress").reduce((sum, b) => sum + b.plannedQuantity, 0);
    const todaysCut = outputs
      .filter((o) => o.recordedDate.slice(0, 10) === today)
      .reduce((sum, o) => sum + o.cutQuantity, 0);

    const totalIssued = fabricIssues.reduce((sum, i) => sum + i.quantity, 0);
    const totalReturned = materialReturns.reduce((sum, r) => sum + r.quantity, 0);
    const totalUsed = outputs.reduce((sum, o) => sum + o.fabricUsed, 0);
    const reconciliation = getFabricReconciliation(totalIssued, totalUsed, totalReturned);

    const pendingBundling = batches
      .filter((b) => b.status === "in_progress" || b.status === "completed")
      .reduce((sum, b) => sum + getAvailableForBundling(b.id, outputs, bundles), 0);

    const readyForSewing = bundles
      .filter((b) => b.status === "ready_for_sewing" || b.status === "issued_to_sewing" || b.status === "in_sewing" || b.status === "completed")
      .reduce((sum, b) => sum + b.quantity, 0);

    return { pending, inProgress, completed, onHold, todaysPlanned, todaysCut, reconciliation, pendingBundling, readyForSewing };
  }, [orders, batches, outputs, bundles, fabricIssues, materialReturns, today]);

  const warnings = useMemo(() => {
    const list: Array<{ level: StatusLevel; message: string; href: string }> = [];

    const shortageOrders = orders.filter((o) => {
      if (!activeStatuses.includes(o.status)) return false;
      const balance = balances.find((b) => b.materialId === o.materialId);
      return getMaterialReadiness(o.fabricRequired, getAvailableFabric(balance)) === "shortage";
    });
    if (shortageOrders.length > 0) {
      list.push({ level: "critical", message: `${shortageOrders.length} cutting order${shortageOrders.length === 1 ? "" : "s"} with material shortage`, href: "/cutting/orders" });
    }

    const delayedOrders = orders.filter((o) => o.plannedEnd && o.plannedEnd < today && !["completed", "cancelled"].includes(o.status));
    if (delayedOrders.length > 0) {
      list.push({ level: "critical", message: `${delayedOrders.length} cutting order${delayedOrders.length === 1 ? "" : "s"} delayed past plan`, href: "/cutting/orders" });
    }

    if (metrics.onHold.length > 0) {
      list.push({ level: "warning", message: `${metrics.onHold.length} cutting order${metrics.onHold.length === 1 ? "" : "s"} on hold`, href: "/cutting/orders" });
    }

    if (metrics.pendingBundling > 0) {
      list.push({ level: "warning", message: `${metrics.pendingBundling.toLocaleString()} good pieces cut and waiting to be bundled`, href: "/cutting/orders" });
    }

    if (metrics.reconciliation.unaccounted > 0) {
      list.push({ level: "critical", message: `${metrics.reconciliation.unaccounted.toLocaleString()} ${orders[0]?.unit ?? "units"} of fabric unaccounted for across cutting orders`, href: "/cutting/orders" });
    } else if (metrics.reconciliation.wastagePercent > 8) {
      list.push({ level: "warning", message: `Fabric wastage running at ${formatPercent(metrics.reconciliation.wastagePercent)} — above the 8% guideline`, href: "/cutting/orders" });
    }

    return list;
  }, [orders, balances, metrics, today]);

  const upNext = useMemo(() => {
    const priorityRank: Record<CuttingOrder["priority"], number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    return [...metrics.pending, ...metrics.onHold]
      .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || (a.plannedEnd ?? "").localeCompare(b.plannedEnd ?? ""))
      .slice(0, 5);
  }, [metrics.pending, metrics.onHold]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="p-5">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cutting"
        description="What's happening in cutting right now"
        actions={
          <Button variant="outline" asChild>
            <Link href="/cutting/orders">Cutting Orders</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending Cutting" value={metrics.pending.length.toString()} icon={ListChecks} href="/cutting/orders" />
        <StatCard label="In Progress" value={metrics.inProgress.length.toString()} icon={Scissors} accent="info" href="/cutting/orders" />
        <StatCard label="Completed" value={metrics.completed.length.toString()} icon={CheckCircle2} accent="success" href="/cutting/orders" />
        <StatCard label="Ready for Sewing" value={`${metrics.readyForSewing.toLocaleString()} pcs`} icon={PackageCheck} accent="success" href="/cutting/bundles" />
      </div>

      {warnings.length > 0 && (
        <Card className="flex flex-col gap-2 p-4">
          <span className="text-sm font-semibold text-foreground">Needs attention</span>
          {warnings.map((warning, index) => (
            <Link
              key={index}
              href={warning.href}
              className={
                warning.level === "critical"
                  ? "flex items-center gap-2 rounded-lg border border-critical/25 bg-critical-subtle px-3 py-2 text-sm text-critical hover:opacity-80"
                  : "flex items-center gap-2 rounded-lg border border-warning/25 bg-warning-subtle px-3 py-2 text-sm text-warning hover:opacity-80"
              }
            >
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              {warning.message}
            </Link>
          ))}
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's Planned" value={`${metrics.todaysPlanned.toLocaleString()} pcs`} icon={Target} accent="info" />
        <StatCard label="Today's Cut" value={`${metrics.todaysCut.toLocaleString()} pcs`} icon={Boxes} accent="info" />
        <StatCard
          label="Fabric Wastage"
          value={formatPercent(metrics.reconciliation.wastagePercent)}
          helpText={`${metrics.reconciliation.wastage.toLocaleString()} ${orders[0]?.unit ?? ""} across all orders`}
          icon={AlertTriangle}
          accent={metrics.reconciliation.wastagePercent > 8 ? "warning" : "success"}
        />
        <StatCard label="Pending Bundling" value={`${metrics.pendingBundling.toLocaleString()} pcs`} icon={Layers} accent={metrics.pendingBundling > 0 ? "warning" : "success"} href="/cutting/bundles" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Up Next</h2>
          <Link href="/cutting/orders" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {upNext.length === 0 ? (
          <EmptyState icon={Scissors} title="Nothing waiting on cutting" description="Every cutting order is either in progress or completed." />
        ) : (
          <div className="flex flex-col gap-3">
            {upNext.map((order) => {
              const statusMeta = cuttingOrderStatusMeta[order.status];
              const priorityMeta = orderPriorityMeta[order.priority];
              const cutSoFar = getCuttingOrderCutQuantity(order.id, batches, outputs);
              return (
                <Card key={order.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{order.cuttingOrderNumber}</span>
                      <StatusBadge label={statusMeta.label} level={statusMeta.level} />
                      <StatusBadge label={priorityMeta.label} level={priorityMeta.level} hideIcon />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {order.customerName} · {order.styleCode} · {order.colorName} · {order.requiredQuantity.toLocaleString()} pcs
                    </span>
                    {cutSoFar > 0 && (
                      <span className="text-xs text-muted-foreground">{cutSoFar.toLocaleString()} pcs already cut</span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/cutting/orders/${order.id}`}>View</Link>
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
