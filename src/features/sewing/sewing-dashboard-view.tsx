"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ClipboardList, Layers, ListChecks, Loader2, PackageCheck, Scissors, Target, Wrench } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { LabeledProgress } from "@/components/shared/labeled-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sewingOrderStatusMeta, orderPriorityMeta } from "@/lib/status";
import {
  getAchievementPercent,
  getSewingLineSnapshot,
  getSewingOrderQuantitySummary,
  getLineOverCapacityAmount,
  getPendingReworkQuantity,
  isSewingOrderDelayed,
} from "@/lib/sewing-utils";
import { sewingOrderHooks, sewingProductionEntryHooks, sewingReworkHooks } from "@/features/sewing/service";
import { bundleHooks } from "@/features/cutting/bundle-service";
import { productionLineHooks } from "@/features/production-lines/service";
import { CreateSewingOrderDialog } from "@/features/sewing/create-sewing-order-dialog";
import { mockDepartments } from "@/mock-data";
import type { SewingOrder, StatusLevel } from "@/types";

const sewingDeptId = mockDepartments.find((d) => d.code === "SEW")?.id;
const activeStatuses: SewingOrder["status"][] = ["assigned", "ready", "in_progress", "partially_completed", "on_hold", "processing_complete"];

export function SewingDashboardView() {
  const { data: orders = [], isLoading } = sewingOrderHooks.useList();
  const { data: entries = [] } = sewingProductionEntryHooks.useList();
  const { data: reworks = [] } = sewingReworkHooks.useList();
  const { data: bundles = [] } = bundleHooks.useList();
  const { data: lines = [] } = productionLineHooks.useList();
  const [createOpen, setCreateOpen] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const sewingLines = useMemo(() => lines.filter((l) => l.departmentId === sewingDeptId), [lines]);

  const metrics = useMemo(() => {
    const readyBundles = bundles.filter((b) => b.status === "ready_for_sewing");
    const assignedBundles = bundles.filter((b) => b.status === "assigned");
    const active = orders.filter((o) => activeStatuses.includes(o.status));
    const inProgress = orders.filter((o) => o.status === "in_progress");
    const onHold = orders.filter((o) => o.status === "on_hold");
    const delayed = orders.filter((o) => isSewingOrderDelayed(o, today));

    const todaysPlanned = active
      .filter((o) => o.plannedStart && o.plannedEnd && today >= o.plannedStart && today <= o.plannedEnd)
      .reduce((sum, o) => sum + o.quantity, 0);
    const todaysGood = entries.filter((e) => e.date === today).reduce((sum, e) => sum + e.goodQuantity, 0);
    const todaysRejected = entries.filter((e) => e.date === today).reduce((sum, e) => sum + e.rejectedQuantity, 0);
    const pendingRework = orders.reduce((sum, o) => sum + getPendingReworkQuantity(o.id, reworks), 0);

    const relevant = orders.filter((o) => o.status !== "planned" && o.status !== "cancelled");
    const totalPlanned = relevant.reduce((sum, o) => sum + o.quantity, 0);
    const totalGood = relevant.reduce((sum, o) => sum + getSewingOrderQuantitySummary(o, entries, reworks).goodOutput, 0);
    const overallProgress = getAchievementPercent(totalGood, totalPlanned);

    return { readyBundles, assignedBundles, active, inProgress, onHold, delayed, todaysPlanned, todaysGood, todaysRejected, pendingRework, overallProgress };
  }, [orders, entries, reworks, bundles, today]);

  const lineSnapshots = useMemo(
    () => sewingLines.map((line) => getSewingLineSnapshot(line, orders, entries, reworks)),
    [sewingLines, orders, entries, reworks],
  );

  const alerts = useMemo(() => {
    const list: Array<{ level: StatusLevel; message: string; href: string }> = [];

    if (metrics.delayed.length > 0) {
      list.push({ level: "critical", message: `${metrics.delayed.length} sewing order${metrics.delayed.length === 1 ? "" : "s"} delayed past plan`, href: "/sewing/orders" });
    }
    const overCapacity = lineSnapshots.filter((s) => getLineOverCapacityAmount(s) > 0);
    for (const snapshot of overCapacity) {
      list.push({ level: "warning", message: `${snapshot.lineName} is over capacity — ${snapshot.assigned.toLocaleString()} pcs planned vs. ${snapshot.dailyCapacity.toLocaleString()} pcs/day`, href: "/sewing/orders" });
    }
    if (metrics.todaysGood + metrics.todaysRejected > 0) {
      const rejectionRate = (metrics.todaysRejected / (metrics.todaysGood + metrics.todaysRejected)) * 100;
      if (rejectionRate > 5) {
        list.push({ level: "warning", message: `Today's rejection rate is running at ${rejectionRate.toFixed(1)}% — above the 5% guideline`, href: "/sewing/orders" });
      }
    }
    if (metrics.pendingRework > 0) {
      list.push({ level: "warning", message: `${metrics.pendingRework.toLocaleString()} pcs waiting on rework`, href: "/sewing/orders" });
    }
    if (metrics.readyBundles.length > 0) {
      list.push({ level: "info", message: `${metrics.readyBundles.length} bundle${metrics.readyBundles.length === 1 ? "" : "s"} ready for sewing and not yet assigned`, href: "/sewing/bundles" });
    }
    if (metrics.onHold.length > 0) {
      list.push({ level: "warning", message: `${metrics.onHold.length} sewing order${metrics.onHold.length === 1 ? "" : "s"} on hold`, href: "/sewing/orders" });
    }

    return list;
  }, [metrics, lineSnapshots]);

  const upNext = useMemo(() => {
    const priorityRank: Record<SewingOrder["priority"], number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    return [...metrics.active]
      .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || (a.plannedEnd ?? "").localeCompare(b.plannedEnd ?? ""))
      .slice(0, 5);
  }, [metrics.active]);

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
        title="Sewing"
        description="What's happening on the sewing floor right now"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/sewing/orders">Sewing Orders</Link>
            </Button>
            <Button onClick={() => setCreateOpen(true)}>Create Sewing Order</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Ready for Sewing" value={`${metrics.readyBundles.length} bundles`} icon={ListChecks} href="/sewing/bundles" />
        <StatCard label="Assigned" value={`${metrics.assignedBundles.length} bundles`} icon={Layers} accent="info" href="/sewing/bundles" />
        <StatCard label="Active Sewing Orders" value={metrics.inProgress.length.toString()} icon={Scissors} accent="info" href="/sewing/orders" />
        <StatCard label="Sewing Progress" value={`${metrics.overallProgress}%`} icon={CheckCircle2} accent="success" />
      </div>

      {alerts.length > 0 && (
        <Card className="flex flex-col gap-2 p-4">
          <span className="text-sm font-semibold text-foreground">Needs attention</span>
          {alerts.map((alert, index) => (
            <Link
              key={index}
              href={alert.href}
              className={
                alert.level === "critical"
                  ? "flex items-center gap-2 rounded-lg border border-critical/25 bg-critical-subtle px-3 py-2 text-sm text-critical hover:opacity-80"
                  : alert.level === "warning"
                    ? "flex items-center gap-2 rounded-lg border border-warning/25 bg-warning-subtle px-3 py-2 text-sm text-warning hover:opacity-80"
                    : "flex items-center gap-2 rounded-lg border border-info/25 bg-info-subtle px-3 py-2 text-sm text-info hover:opacity-80"
              }
            >
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              {alert.message}
            </Link>
          ))}
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's Plan" value={`${metrics.todaysPlanned.toLocaleString()} pcs`} icon={Target} accent="info" />
        <StatCard label="Good Output" value={`${metrics.todaysGood.toLocaleString()} pcs`} icon={PackageCheck} accent="success" />
        <StatCard label="Rejected" value={`${metrics.todaysRejected.toLocaleString()} pcs`} icon={AlertTriangle} accent={metrics.todaysRejected > 0 ? "warning" : "success"} />
        <StatCard label="Pending Rework" value={`${metrics.pendingRework.toLocaleString()} pcs`} icon={Wrench} accent={metrics.pendingRework > 0 ? "warning" : "success"} href="/sewing/orders" />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Line Utilization</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {lineSnapshots.map((snapshot) => (
            <Card key={snapshot.lineId} className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{snapshot.lineName}</span>
                <span className="text-xs text-muted-foreground">{snapshot.dailyCapacity.toLocaleString()} pcs/day capacity</span>
              </div>
              <LabeledProgress
                label="Assigned vs. Capacity"
                current={snapshot.assigned}
                total={snapshot.dailyCapacity}
                valueLabel={`${snapshot.assigned.toLocaleString()} / ${snapshot.dailyCapacity.toLocaleString()}`}
                level={snapshot.utilizationPercent > 100 ? "critical" : snapshot.utilizationPercent > 85 ? "warning" : "success"}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Completed: {snapshot.completed.toLocaleString()} pcs</span>
                <span>Remaining: {snapshot.remaining.toLocaleString()} pcs</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Up Next</h2>
          <Link href="/sewing/orders" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {upNext.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Nothing active on the sewing floor" description="Every sewing order is either planned, completed or cancelled." />
        ) : (
          <div className="flex flex-col gap-3">
            {upNext.map((order) => {
              const statusMeta = sewingOrderStatusMeta[order.status];
              const priorityMeta = orderPriorityMeta[order.priority];
              const summary = getSewingOrderQuantitySummary(order, entries, reworks);
              return (
                <Card key={order.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{order.sewingOrderNumber}</span>
                      <StatusBadge label={statusMeta.label} level={statusMeta.level} />
                      <StatusBadge label={priorityMeta.label} level={priorityMeta.level} hideIcon />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {order.customerName} · {order.styleCode} · {order.colorName} · {order.quantity.toLocaleString()} pcs
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Good {summary.goodOutput.toLocaleString()} · Remaining {summary.remaining.toLocaleString()}
                      {summary.pendingRework > 0 ? ` · Rework pending ${summary.pendingRework.toLocaleString()}` : ""}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/sewing/orders/${order.id}`}>View</Link>
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CreateSewingOrderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
