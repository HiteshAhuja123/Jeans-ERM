"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, Boxes, Gauge, Package, PackageCheck, PackageSearch, ShieldCheck, Ship } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProductionTrendChart } from "@/features/dashboard/production-trend-chart";
import { ProductionSnapshotCard } from "@/features/dashboard/production-snapshot-card";
import { AlertsCard } from "@/features/dashboard/alerts-card";
import { ApprovalsCard } from "@/features/dashboard/approvals-card";
import { ActivityFeedCard } from "@/features/dashboard/activity-feed-card";
import { getDashboardProfile } from "@/features/dashboard/role-dashboards";
import { dashboardMetrics } from "@/lib/derived";
import { formatDate, formatPercent } from "@/lib/format";
import { useRole } from "@/lib/role-context";
import { usePermissions } from "@/lib/permissions";
import { getBottleneckStage, getFulfillmentInsights, getProductionInsights, getQualityInsights } from "@/lib/insights-utils";
import { getOperationalAlerts } from "@/lib/alerts-engine";
import { getPendingApprovals } from "@/lib/approvals";
import { getGlobalActivityFeed } from "@/lib/audit";
import { getQcOrderAvailableForPacking } from "@/lib/packing-utils";
import { orderHooks } from "@/features/orders/service";
import { productionOrderHooks } from "@/features/production/service";
import { inventoryHooks } from "@/features/inventory/service";
import { materialHooks } from "@/features/materials/service";
import { finishedGoodsHooks } from "@/features/inventory/finished-goods-service";
import { qcInspectionEntryHooks, qcOrderHooks, qcReworkHooks } from "@/features/quality/service";
import { packingOrderHooks } from "@/features/packing/service";
import { dispatchOrderHooks } from "@/features/dispatch/service";
import { purchaseOrderHooks, purchaseRequestHooks } from "@/features/purchasing/service";
import { roleLabels } from "@/mock-data/users";
import { mockDailyProduction, mockProductionProgress, productionStageLabels } from "@/mock-data";

const alertModuleHrefs: Record<string, string> = {
  Orders: "/orders",
  Inventory: "/inventory?stock=attention",
  Quality: "/quality",
  Production: "/production/orders",
  Packing: "/packing",
};

export function DashboardView() {
  const { previewRole, isPreviewing } = useRole();
  const { canApprove } = usePermissions();
  const profile = getDashboardProfile(previewRole);

  const today = new Date().toISOString().slice(0, 10);

  const { data: orders = [] } = orderHooks.useList();
  const { data: productionOrders = [] } = productionOrderHooks.useList();
  const { data: inventoryBalances = [] } = inventoryHooks.useList();
  const { data: materials = [] } = materialHooks.useList();
  const { data: qcOrders = [] } = qcOrderHooks.useList();
  const { data: qcEntries = [] } = qcInspectionEntryHooks.useList();
  const { data: qcReworks = [] } = qcReworkHooks.useList();
  const { data: packingOrders = [] } = packingOrderHooks.useList();
  const { data: fgBalances = [] } = finishedGoodsHooks.useList();
  const { data: dispatchOrders = [] } = dispatchOrderHooks.useList();
  const { data: purchaseRequests = [] } = purchaseRequestHooks.useList();
  const { data: purchaseOrders = [] } = purchaseOrderHooks.useList();

  const productionPercent =
    (dashboardMetrics.todaysProduction.completed / dashboardMetrics.todaysProduction.target) * 100;

  const productionInsights = useMemo(() => getProductionInsights(productionOrders, today, today), [productionOrders, today]);
  const bottleneck = useMemo(() => getBottleneckStage(productionOrders), [productionOrders]);
  const qualityInsights = useMemo(() => getQualityInsights(qcOrders, qcEntries, qcReworks), [qcOrders, qcEntries, qcReworks]);

  const readyForPackingCount = useMemo(
    () => qcOrders.filter((q) => getQcOrderAvailableForPacking(q, qcEntries, qcReworks, packingOrders) > 0).length,
    [qcOrders, qcEntries, qcReworks, packingOrders],
  );
  const fulfillment = useMemo(
    () => getFulfillmentInsights(packingOrders, fgBalances, dispatchOrders, readyForPackingCount, today),
    [packingOrders, fgBalances, dispatchOrders, readyForPackingCount, today],
  );

  const allAlerts = useMemo(
    () => getOperationalAlerts({ inventoryBalances, materials, productionOrders, qcOrders, orders, packingOrders, today }),
    [inventoryBalances, materials, productionOrders, qcOrders, orders, packingOrders, today],
  );
  const alerts = profile.alertModules ? allAlerts.filter((alert) => profile.alertModules!.includes(alert.module)) : allAlerts;
  const alertsViewAllHref =
    profile.alertModules?.length === 1 ? alertModuleHrefs[profile.alertModules[0]] : "/inventory?stock=attention";

  const allApprovals = useMemo(() => getPendingApprovals(purchaseRequests, purchaseOrders), [purchaseRequests, purchaseOrders]);
  const approvals = profile.approvalTypes ? allApprovals.filter((approval) => profile.approvalTypes!.includes(approval.type)) : allApprovals;

  const activity = useMemo(() => getGlobalActivityFeed(8), []);

  const showChartRow = profile.showChart || profile.showAlerts;
  const needsAttention = productionInsights.delayed.length > 0 || qualityInsights.onHoldOrders.length > 0 || !!bottleneck;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description={`${profile.greeting} — ${formatDate("2026-08-19")}`}
        actions={
          isPreviewing ? (
            <StatusBadge label={`Previewing as ${roleLabels[previewRole]}`} level="info" />
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Today's Production"
          value={`${dashboardMetrics.todaysProduction.completed.toLocaleString()} / ${dashboardMetrics.todaysProduction.target.toLocaleString()}`}
          helpText={`${formatPercent(productionPercent, 0)} of target`}
          icon={Boxes}
          accent={productionPercent >= 90 ? "success" : "warning"}
          href="/production"
        />
        <StatCard
          label="Active Orders"
          value={dashboardMetrics.activeOrders.toString()}
          helpText={`${dashboardMetrics.delayedOrders} delayed`}
          icon={Package}
          accent={dashboardMetrics.delayedOrders > 0 ? "critical" : "success"}
          href={dashboardMetrics.delayedOrders > 0 ? "/orders?delayed=1" : "/orders"}
        />
        <StatCard
          label="Inventory Alerts"
          value={dashboardMetrics.lowStockItems.toString()}
          helpText="materials below reorder level"
          icon={PackageSearch}
          accent={dashboardMetrics.lowStockItems > 0 ? "warning" : "success"}
          href="/inventory?stock=attention"
        />
        <StatCard
          label="QC Pass Rate"
          value={formatPercent(dashboardMetrics.qcPassRate)}
          helpText={`${dashboardMetrics.openQcIssues} open issues`}
          icon={ShieldCheck}
          accent={dashboardMetrics.qcPassRate >= 95 ? "success" : "warning"}
          href="/quality"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Rework Pending"
          value={qualityInsights.pendingRework.toLocaleString()}
          helpText="pcs awaiting rework resolution"
          icon={AlertTriangle}
          accent={qualityInsights.pendingRework > 0 ? "warning" : "success"}
          href="/quality"
        />
        <StatCard
          label="Finished Goods Available"
          value={fulfillment.finishedGoodsAvailable.toLocaleString()}
          helpText={`${fulfillment.readyForPacking} QC order${fulfillment.readyForPacking === 1 ? "" : "s"} ready for packing`}
          icon={PackageCheck}
          accent={fulfillment.finishedGoodsAvailable > 0 ? "info" : "neutral"}
          href="/inventory/finished-goods"
        />
        <StatCard
          label="Packing In Progress"
          value={fulfillment.packingInProgress.toString()}
          helpText={`${fulfillment.packed} packed`}
          icon={Boxes}
          href="/packing"
        />
        <StatCard
          label="Dispatched (7 days)"
          value={fulfillment.recentlyDispatchedQty.toLocaleString()}
          helpText="pcs shipped this week"
          icon={Ship}
          href="/dispatch"
        />
      </div>

      {needsAttention && (
        <Card className="flex flex-col gap-2 p-4">
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Gauge className="size-4 text-muted-foreground" aria-hidden="true" />
            Needs attention
          </span>
          {productionInsights.delayed.length > 0 && (
            <Link href="/production/orders" className="text-sm text-critical hover:underline">
              {productionInsights.delayed.length} production order{productionInsights.delayed.length === 1 ? "" : "s"} behind schedule
            </Link>
          )}
          {bottleneck && (
            <Link href="/reports" className="text-sm text-warning hover:underline">
              {bottleneck.count} order{bottleneck.count === 1 ? "" : "s"} currently backed up at {productionStageLabels[bottleneck.stage]}
            </Link>
          )}
          {qualityInsights.onHoldOrders.length > 0 && (
            <Link href="/quality" className="text-sm text-warning hover:underline">
              {qualityInsights.onHoldOrders.length} QC order{qualityInsights.onHoldOrders.length === 1 ? "" : "s"} on hold
            </Link>
          )}
        </Card>
      )}

      {showChartRow && (
        <div className={`grid grid-cols-1 gap-4 ${profile.showChart && profile.showAlerts ? "lg:grid-cols-3" : ""}`}>
          {profile.showChart && (
            <Card className={profile.showAlerts ? "lg:col-span-2" : undefined}>
              <CardHeader>
                <CardTitle>Production — Last 14 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductionTrendChart data={mockDailyProduction} />
              </CardContent>
            </Card>
          )}
          {profile.showAlerts && <AlertsCard alerts={alerts} viewAllHref={alertsViewAllHref} />}
        </div>
      )}

      {profile.showProductionSnapshot && <ProductionSnapshotCard orders={mockProductionProgress} />}

      <div className={`grid grid-cols-1 gap-4 ${profile.showApprovals ? "lg:grid-cols-2" : ""}`}>
        {profile.showApprovals && <ApprovalsCard approvals={approvals} canApprove={canApprove} />}
        <ActivityFeedCard activity={activity} />
      </div>
    </div>
  );
}
