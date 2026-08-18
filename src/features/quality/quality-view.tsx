import { AlertOctagon, CheckCircle2, ClipboardCheck, Wrench } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatPercent } from "@/lib/format";
import { defectSeverityMeta } from "@/lib/status";
import { dashboardMetrics } from "@/lib/derived";
import { mockDefects, mockQcInspections } from "@/mock-data";
import { productionStageLabels } from "@/mock-data/production";

const defectStatusLabels: Record<string, string> = {
  open: "Open",
  in_rework: "In Rework",
  resolved: "Resolved",
  rejected: "Rejected",
};

const defectStatusLevels: Record<string, "success" | "warning" | "critical" | "neutral"> = {
  open: "critical",
  in_rework: "warning",
  resolved: "success",
  rejected: "neutral",
};

export function QualityView() {
  const inReworkCount = mockDefects.filter((d) => d.status === "in_rework").length;
  const criticalCount = mockDefects.filter((d) => d.severity === "critical").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Quality" description="Inspections, defects, rework and rejections" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Overall Pass Rate"
          value={formatPercent(dashboardMetrics.qcPassRate)}
          icon={CheckCircle2}
          accent={dashboardMetrics.qcPassRate >= 95 ? "success" : "warning"}
        />
        <StatCard
          label="Open Defects"
          value={dashboardMetrics.openQcIssues.toString()}
          icon={AlertOctagon}
          accent={dashboardMetrics.openQcIssues > 0 ? "critical" : "success"}
        />
        <StatCard label="In Rework" value={inReworkCount.toString()} icon={Wrench} accent="warning" />
        <StatCard
          label="Critical Defects"
          value={criticalCount.toString()}
          icon={ClipboardCheck}
          accent={criticalCount > 0 ? "critical" : "success"}
        />
      </div>

      <Tabs defaultValue="inspections">
        <TabsList>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="defects">Defects &amp; Rework</TabsTrigger>
        </TabsList>

        <TabsContent value="inspections">
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Inspected</TableHead>
                  <TableHead className="text-right">Passed</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead className="text-right">Pass Rate</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockQcInspections.map((inspection) => (
                  <TableRow key={inspection.id}>
                    <TableCell className="font-medium text-foreground">
                      {inspection.orderNumber}
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        {inspection.styleCode}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {productionStageLabels[inspection.stage]}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-foreground">
                      {inspection.inspectedQty.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-success">
                      {inspection.passedQty.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-critical">
                      {inspection.failedQty.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-foreground">
                      {formatPercent(inspection.passRate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{inspection.inspector}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDate(inspection.date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="flex flex-col gap-3 md:hidden">
            {mockQcInspections.map((inspection) => (
              <Card key={inspection.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {inspection.orderNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {inspection.styleCode} · {productionStageLabels[inspection.stage]}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {formatPercent(inspection.passRate)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    <span className="text-success">{inspection.passedQty}</span> passed ·{" "}
                    <span className="text-critical">{inspection.failedQty}</span> failed
                  </span>
                  <span>{formatDate(inspection.date)}</span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="defects">
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Defect</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Reported</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDefects.map((defect) => {
                  const severityMeta = defectSeverityMeta[defect.severity];
                  return (
                    <TableRow key={defect.id}>
                      <TableCell className="font-medium text-foreground">{defect.orderNumber}</TableCell>
                      <TableCell className="text-foreground">{defect.defectType}</TableCell>
                      <TableCell>
                        <StatusBadge label={severityMeta.label} level={severityMeta.level} hideIcon />
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-foreground">
                        {defect.quantity}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {productionStageLabels[defect.stage]}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={defectStatusLabels[defect.status]}
                          level={defectStatusLevels[defect.status]}
                        />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(defect.reportedDate)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
          <div className="flex flex-col gap-3 md:hidden">
            {mockDefects.map((defect) => {
              const severityMeta = defectSeverityMeta[defect.severity];
              return (
                <Card key={defect.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{defect.orderNumber}</span>
                      <span className="text-xs text-muted-foreground">{defect.defectType}</span>
                    </div>
                    <StatusBadge
                      label={defectStatusLabels[defect.status]}
                      level={defectStatusLevels[defect.status]}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <StatusBadge label={severityMeta.label} level={severityMeta.level} hideIcon />
                    <span>
                      {defect.quantity} pcs · {formatDate(defect.reportedDate)}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
