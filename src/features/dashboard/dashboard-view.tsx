"use client";

import { Boxes, Package, PackageSearch, ShieldCheck } from "lucide-react";

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
import { roleLabels } from "@/mock-data/users";
import {
  mockActivity,
  mockAlerts,
  mockApprovals,
  mockDailyProduction,
  mockProductionProgress,
} from "@/mock-data";

const alertModuleHrefs: Record<string, string> = {
  Orders: "/orders",
  Inventory: "/inventory?stock=attention",
  Quality: "/quality",
};

export function DashboardView() {
  const { previewRole, isPreviewing } = useRole();
  const profile = getDashboardProfile(previewRole);

  const productionPercent =
    (dashboardMetrics.todaysProduction.completed / dashboardMetrics.todaysProduction.target) * 100;

  const alerts = profile.alertModules
    ? mockAlerts.filter((alert) => profile.alertModules!.includes(alert.module))
    : mockAlerts;
  const approvals = profile.approvalTypes
    ? mockApprovals.filter((approval) => profile.approvalTypes!.includes(approval.type))
    : mockApprovals;
  const alertsViewAllHref =
    profile.alertModules?.length === 1 ? alertModuleHrefs[profile.alertModules[0]] : "/inventory?stock=attention";

  const showChartRow = profile.showChart || profile.showAlerts;

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
        {profile.showApprovals && <ApprovalsCard approvals={approvals} />}
        <ActivityFeedCard activity={mockActivity} />
      </div>
    </div>
  );
}
