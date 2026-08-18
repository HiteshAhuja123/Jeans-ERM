import { Boxes, Package, PackageSearch, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ProductionTrendChart } from "@/features/dashboard/production-trend-chart";
import { ProductionSnapshotCard } from "@/features/dashboard/production-snapshot-card";
import { AlertsCard } from "@/features/dashboard/alerts-card";
import { ApprovalsCard } from "@/features/dashboard/approvals-card";
import { ActivityFeedCard } from "@/features/dashboard/activity-feed-card";
import { dashboardMetrics } from "@/lib/derived";
import { formatDate, formatPercent } from "@/lib/format";
import {
  mockActivity,
  mockAlerts,
  mockApprovals,
  mockDailyProduction,
  mockProductionProgress,
} from "@/mock-data";

export function DashboardView() {
  const productionPercent =
    (dashboardMetrics.todaysProduction.completed / dashboardMetrics.todaysProduction.target) * 100;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description={`What's happening in your factory today — ${formatDate("2026-08-19")}`}
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
          href="/orders"
        />
        <StatCard
          label="Inventory Alerts"
          value={dashboardMetrics.lowStockItems.toString()}
          helpText="materials below reorder level"
          icon={PackageSearch}
          accent={dashboardMetrics.lowStockItems > 0 ? "warning" : "success"}
          href="/inventory"
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Production — Last 14 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductionTrendChart data={mockDailyProduction} />
          </CardContent>
        </Card>

        <AlertsCard alerts={mockAlerts} />
      </div>

      <ProductionSnapshotCard orders={mockProductionProgress} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ApprovalsCard approvals={mockApprovals} />
        <ActivityFeedCard activity={mockActivity} />
      </div>
    </div>
  );
}
