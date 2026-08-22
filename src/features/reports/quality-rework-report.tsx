"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ClipboardCheck, ShieldCheck, XCircle } from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MasterDataTable, type MasterDataColumn } from "@/components/shared/master-data-table";
import { MasterDataCards } from "@/components/shared/master-data-cards";
import { Pagination, usePagination } from "@/components/shared/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPercent } from "@/lib/format";
import { qcOrderStatusMeta } from "@/lib/status";
import { getQcQuantitySummary } from "@/lib/post-sewing-utils";
import { getDefectReasonBreakdown, getQualityInsights } from "@/lib/insights-utils";
import { qcInspectionEntryHooks, qcOrderHooks, qcReworkHooks } from "@/features/quality/service";
import { QcDonutChart } from "@/features/reports/qc-donut-chart";
import { mockQcDefectReasons } from "@/mock-data";
import type { QcOrder, QcOrderStatus } from "@/types";

type StatusFilter = QcOrderStatus | "all";

export function QualityReworkReport() {
  const router = useRouter();
  const { data: qcOrders = [] } = qcOrderHooks.useList();
  const { data: qcEntries = [] } = qcInspectionEntryHooks.useList();
  const { data: qcReworks = [] } = qcReworkHooks.useList();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const insights = useMemo(() => getQualityInsights(qcOrders, qcEntries, qcReworks), [qcOrders, qcEntries, qcReworks]);
  const defectBreakdown = useMemo(() => getDefectReasonBreakdown(qcEntries, qcReworks), [qcEntries, qcReworks]);
  const maxDefectQty = Math.max(1, ...Object.values(defectBreakdown));

  const worstFirst = useMemo(() => {
    const q = search.trim().toLowerCase();
    return qcOrders
      .filter((o) => (q ? o.qcOrderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.styleCode.toLowerCase().includes(q) : true))
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .map((o) => ({ order: o, summary: getQcQuantitySummary(o, qcEntries, qcReworks) }))
      .sort((a, b) => b.summary.rejected + b.summary.pendingRework - (a.summary.rejected + a.summary.pendingRework))
      .map((r) => r.order);
  }, [qcOrders, qcEntries, qcReworks, search, statusFilter]);

  const { page, pageCount, pageRows, setPage, pageSize, totalCount } = usePagination(worstFirst, 10);

  const columns: MasterDataColumn<QcOrder>[] = [
    { key: "num", header: "QC Order", render: (o) => <span className="font-medium text-foreground">{o.qcOrderNumber}</span> },
    { key: "customer", header: "Customer", render: (o) => o.customerName },
    { key: "style", header: "Style", render: (o) => `${o.styleCode} · ${o.colorName}` },
    {
      key: "quality",
      header: "Passed / Rework / Rejected",
      render: (o) => {
        const s = getQcQuantitySummary(o, qcEntries, qcReworks);
        return `${s.passed.toLocaleString()} / ${s.pendingRework.toLocaleString()} / ${s.rejected.toLocaleString()}`;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (o) => {
        const meta = qcOrderStatusMeta[o.status];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Inspected" value={insights.inspected.toLocaleString()} icon={ClipboardCheck} />
        <StatCard label="Passed" value={insights.passed.toLocaleString()} icon={CheckCircle2} accent="success" />
        <StatCard label="Rework Pending" value={insights.pendingRework.toLocaleString()} icon={AlertTriangle} accent={insights.pendingRework > 0 ? "warning" : "success"} />
        <StatCard label="Rejected" value={insights.rejected.toLocaleString()} icon={XCircle} accent={insights.rejected > 0 ? "critical" : "success"} />
        <StatCard label="Pass Rate" value={formatPercent(insights.passRate)} icon={ShieldCheck} accent={insights.passRate >= 95 ? "success" : "warning"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inspection Outcome</CardTitle>
          </CardHeader>
          <CardContent>
            <QcDonutChart passed={insights.passed} pendingRework={insights.pendingRework} rejected={insights.rejected} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Defect Reasons</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {Object.keys(defectBreakdown).length === 0 ? (
              <EmptyState icon={ShieldCheck} title="No defects recorded" description="Defect reason breakdown will appear here once inspections flag issues." />
            ) : (
              mockQcDefectReasons
                .filter((r) => defectBreakdown[r.id] > 0)
                .sort((a, b) => defectBreakdown[b.id] - defectBreakdown[a.id])
                .map((reason) => (
                  <div key={reason.id} className="flex items-center gap-3">
                    <span className="w-36 shrink-0 truncate text-sm text-foreground" title={reason.label}>{reason.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${reason.label}: ${defectBreakdown[reason.id]} pcs`}>
                      <div className="h-full rounded-full bg-critical" style={{ width: `${(defectBreakdown[reason.id] / maxDefectQty) * 100}%` }} />
                    </div>
                    <span className="w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{defectBreakdown[reason.id].toLocaleString()} pcs</span>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search QC order, customer or style…">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(qcOrderStatusMeta).map(([value, meta]) => (
              <SelectItem key={value} value={value}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      {worstFirst.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No QC orders match your filters" description="Try a different search term or status." />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={pageRows} onRowClick={(o) => router.push(`/quality/${o.id}`)} />
          <MasterDataCards
            rows={pageRows}
            renderCard={(o) => {
              const meta = qcOrderStatusMeta[o.status];
              const s = getQcQuantitySummary(o, qcEntries, qcReworks);
              return (
                <Card key={o.id} className="flex flex-col gap-2 p-4" onClick={() => router.push(`/quality/${o.id}`)}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">{o.qcOrderNumber}</span>
                    <StatusBadge label={meta.label} level={meta.level} />
                  </div>
                  <span className="text-xs text-muted-foreground">{o.customerName} · {o.styleCode}</span>
                  <span className="text-xs text-muted-foreground">Passed {s.passed.toLocaleString()} · Rework {s.pendingRework.toLocaleString()} · Rejected {s.rejected.toLocaleString()}</span>
                </Card>
              );
            }}
          />
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} totalCount={totalCount} pageSize={pageSize} />
        </>
      )}
    </div>
  );
}
