"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertOctagon, CheckCircle2, ClipboardCheck, SearchX, Wrench } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatPercent } from "@/lib/format";
import { defectSeverityMeta } from "@/lib/status";
import { dashboardMetrics } from "@/lib/derived";
import { mockDefects, mockQcInspections } from "@/mock-data";
import { productionStageLabels } from "@/mock-data/production";
import type { DefectRecord, DefectSeverity, QcInspection } from "@/types";

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

const severityFilters: Array<{ value: DefectSeverity | "all"; label: string }> = [
  { value: "all", label: "All severities" },
  { value: "minor", label: "Minor" },
  { value: "major", label: "Major" },
  { value: "critical", label: "Critical" },
];

function matchesInspection(inspection: QcInspection, query: string) {
  if (!query) return true;
  return `${inspection.orderNumber} ${inspection.styleCode}`.toLowerCase().includes(query.toLowerCase());
}

function matchesDefect(defect: DefectRecord, query: string) {
  if (!query) return true;
  return `${defect.orderNumber} ${defect.defectType}`.toLowerCase().includes(query.toLowerCase());
}

export function QualityView() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [activeTab, setActiveTab] = useState<"inspections" | "defects">("inspections");
  const [severity, setSeverity] = useState<DefectSeverity | "all">("all");

  const inReworkCount = mockDefects.filter((d) => d.status === "in_rework").length;
  const criticalCount = mockDefects.filter((d) => d.severity === "critical").length;

  const filteredInspections = mockQcInspections.filter((i) => matchesInspection(i, search));
  const filteredDefects = mockDefects.filter(
    (d) => matchesDefect(d, search) && (severity === "all" || d.severity === severity),
  );

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

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "inspections" | "defects")}>
        <TabsList>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="defects">Defects &amp; Rework</TabsTrigger>
        </TabsList>

        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by order # or style…"
          className="mt-4"
        >
          {activeTab === "defects" && (
            <Select value={severity} onValueChange={(v) => setSeverity(v as DefectSeverity | "all")}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                {severityFilters.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FilterBar>

        <TabsContent value="inspections" className="mt-4">
          {filteredInspections.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No inspections match your search"
              description="Try a different order number or style code."
            />
          ) : (
            <>
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
                    {filteredInspections.map((inspection) => (
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
                {filteredInspections.map((inspection) => (
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
            </>
          )}
        </TabsContent>

        <TabsContent value="defects" className="mt-4">
          {filteredDefects.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No defects match your filters"
              description="Try a different search term or severity."
            />
          ) : (
            <>
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
                    {filteredDefects.map((defect) => {
                      const severityMeta = defectSeverityMeta[defect.severity];
                      return (
                        <TableRow key={defect.id}>
                          <TableCell className="font-medium text-foreground">
                            {defect.orderNumber}
                          </TableCell>
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
                {filteredDefects.map((defect) => {
                  const severityMeta = defectSeverityMeta[defect.severity];
                  return (
                    <Card key={defect.id} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">
                            {defect.orderNumber}
                          </span>
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
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
