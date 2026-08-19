"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, Boxes, Calendar, CheckCircle2, Clock, Gauge, Target } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { LabeledProgress } from "@/components/shared/labeled-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionTrendChart } from "@/features/dashboard/production-trend-chart";
import { ProductionLineCard } from "@/features/production/production-line-card";
import { formatPercent } from "@/lib/format";
import { dashboardMetrics } from "@/lib/derived";
import { computeMaterialRequirements, getMaterialAvailability } from "@/lib/production-utils";
import { bomHooks, productionOrderHooks } from "@/features/production/service";
import { inventoryHooks } from "@/features/inventory/service";
import { purchaseOrderHooks } from "@/features/purchasing/service";
import { mockDailyProduction, mockProductionLines } from "@/mock-data";
import type { ProductionOrderStatus, StatusLevel } from "@/types";

const activeStatuses: ProductionOrderStatus[] = ["planned", "released", "in_progress", "on_hold", "partially_completed"];
const pendingStatuses: ProductionOrderStatus[] = ["draft", "planned"];

export function ProductionDashboardView() {
  const { data: productionOrders = [] } = productionOrderHooks.useList();
  const { data: boms = [] } = bomHooks.useList();
  const { data: balances = [] } = inventoryHooks.useList();
  const { data: purchaseOrders = [] } = purchaseOrderHooks.useList();

  const today = new Date().toISOString().slice(0, 10);
  const weekOutDate = new Date();
  weekOutDate.setDate(weekOutDate.getDate() + 7);
  const weekOut = weekOutDate.toISOString().slice(0, 10);

  const metrics = useMemo(() => {
    const active = productionOrders.filter((po) => activeStatuses.includes(po.status));
    const pending = productionOrders.filter((po) => pendingStatuses.includes(po.status));
    const dueToday = active.filter((po) => po.plannedEnd === today);
    const dueThisWeek = active.filter((po) => po.plannedEnd >= today && po.plannedEnd <= weekOut);
    const delayed = active.filter((po) => po.plannedEnd < today);
    const completed = productionOrders.filter((po) => po.status === "completed");
    const plannedQty = productionOrders.filter((po) => po.status !== "cancelled").reduce((sum, po) => sum + po.quantity, 0);
    const completedQty = productionOrders.reduce((sum, po) => sum + po.quantityProduced, 0);
    return { active, pending, dueToday, dueThisWeek, delayed, completed, plannedQty, completedQty };
  }, [productionOrders, today, weekOut]);

  const progressPercent = metrics.plannedQty > 0 ? Math.round((metrics.completedQty / metrics.plannedQty) * 100) : 0;

  const unassigned = metrics.active.filter((po) => !po.productionLineId);
  const shortageOrders = useMemo(
    () =>
      metrics.active.filter((po) => {
        const bom = boms.find((b) => b.styleId === po.styleId);
        const lines = computeMaterialRequirements(po.quantity, bom, balances, purchaseOrders);
        const availability = getMaterialAvailability(lines);
        return availability === "shortage" || availability === "partial";
      }),
    [metrics.active, boms, balances, purchaseOrders],
  );

  const warnings: Array<{ level: StatusLevel; message: string; href: string }> = [
    metrics.delayed.length > 0
      ? { level: "critical", message: `${metrics.delayed.length} production order${metrics.delayed.length === 1 ? "" : "s"} delayed`, href: "/production/orders" }
      : null,
    shortageOrders.length > 0
      ? { level: "warning", message: `${shortageOrders.length} order${shortageOrders.length === 1 ? "" : "s"} with material shortages`, href: "/production/planning" }
      : null,
    unassigned.length > 0
      ? { level: "warning", message: `${unassigned.length} order${unassigned.length === 1 ? "" : "s"} without a production line`, href: "/production/orders" }
      : null,
  ].filter((w): w is { level: StatusLevel; message: string; href: string } => w !== null);

  const avgUtilization =
    (mockProductionLines.reduce((sum, l) => sum + l.completed / l.target, 0) / mockProductionLines.length) * 100;
  const productionPercent = (dashboardMetrics.todaysProduction.completed / dashboardMetrics.todaysProduction.target) * 100;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Production" description="What's happening with production right now" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Production Orders" value={metrics.active.length.toString()} icon={Boxes} href="/production/orders" />
        <StatCard label="Pending Production" value={metrics.pending.length.toString()} icon={Clock} accent="info" href="/production/orders" />
        <StatCard label="Due This Week" value={metrics.dueThisWeek.length.toString()} icon={Calendar} accent="info" href="/production/schedule" />
        <StatCard
          label="Delayed"
          value={metrics.delayed.length.toString()}
          icon={AlertTriangle}
          accent={metrics.delayed.length > 0 ? "critical" : "success"}
          href="/production/orders"
        />
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

      <Card className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Overall Production Progress</span>
          <span className="text-xs text-muted-foreground">
            {metrics.completed.length} completed · {metrics.active.length} active
          </span>
        </div>
        <LabeledProgress
          label="Completed vs. planned quantity"
          current={metrics.completedQty}
          total={metrics.plannedQty}
          valueLabel={`${metrics.completedQty.toLocaleString()} / ${metrics.plannedQty.toLocaleString()} pcs`}
          level={progressPercent >= 66 ? "success" : progressPercent >= 33 ? "warning" : "critical"}
        />
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Today's Output"
          value={`${dashboardMetrics.todaysProduction.completed.toLocaleString()} / ${dashboardMetrics.todaysProduction.target.toLocaleString()}`}
          helpText={`${formatPercent(productionPercent, 0)} of target`}
          icon={Target}
          accent={productionPercent >= 90 ? "success" : "warning"}
        />
        <StatCard label="Active Lines" value={mockProductionLines.length.toString()} helpText="cutting → packing" icon={Activity} accent="info" />
        <StatCard
          label="Avg. Line Utilization"
          value={formatPercent(avgUtilization, 0)}
          helpText="of daily target"
          icon={Gauge}
          accent={avgUtilization >= 85 ? "success" : "warning"}
        />
        <StatCard label="Completed Orders" value={metrics.completed.length.toString()} icon={CheckCircle2} accent="success" href="/production/orders" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production — Last 14 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductionTrendChart data={mockDailyProduction} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Production Lines</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {mockProductionLines.map((line) => (
            <ProductionLineCard key={line.id} line={line} />
          ))}
        </div>
      </div>
    </div>
  );
}
