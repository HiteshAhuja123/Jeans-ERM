import { Activity, Ban, Gauge, Target } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionTrendChart } from "@/features/dashboard/production-trend-chart";
import { ProductionSnapshotCard } from "@/features/dashboard/production-snapshot-card";
import { ProductionLineCard } from "@/features/production/production-line-card";
import { formatPercent } from "@/lib/format";
import { dashboardMetrics } from "@/lib/derived";
import { mockDailyProduction, mockProductionLines, mockProductionProgress } from "@/mock-data";

export function ProductionView() {
  const avgUtilization =
    (mockProductionLines.reduce((sum, l) => sum + l.completed / l.target, 0) /
      mockProductionLines.length) *
    100;
  const blockedLines = mockProductionLines.filter((l) => l.completed / l.target < 0.5).length;
  const productionPercent =
    (dashboardMetrics.todaysProduction.completed / dashboardMetrics.todaysProduction.target) * 100;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Production"
        description="Cutting, sewing, washing, finishing — live line status and order progress"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Today's Output"
          value={`${dashboardMetrics.todaysProduction.completed.toLocaleString()} / ${dashboardMetrics.todaysProduction.target.toLocaleString()}`}
          helpText={`${formatPercent(productionPercent, 0)} of target`}
          icon={Target}
          accent={productionPercent >= 90 ? "success" : "warning"}
        />
        <StatCard
          label="Active Lines"
          value={mockProductionLines.length.toString()}
          helpText="cutting → packing"
          icon={Activity}
          accent="info"
        />
        <StatCard
          label="Avg. Line Utilization"
          value={formatPercent(avgUtilization, 0)}
          helpText="of daily target"
          icon={Gauge}
          accent={avgUtilization >= 85 ? "success" : "warning"}
        />
        <StatCard
          label="Lines Behind Pace"
          value={blockedLines.toString()}
          helpText="below 50% of target"
          icon={Ban}
          accent={blockedLines > 0 ? "critical" : "success"}
        />
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

      <ProductionSnapshotCard orders={mockProductionProgress} />
    </div>
  );
}
