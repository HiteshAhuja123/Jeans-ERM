"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, ClipboardCheck, ShieldCheck, Wrench } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MasterDataTable, type MasterDataColumn } from "@/components/shared/master-data-table";
import { MasterDataCards } from "@/components/shared/master-data-cards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPercent } from "@/lib/format";
import { qcOrderStatusMeta } from "@/lib/status";
import { getQcQuantitySummary } from "@/lib/post-sewing-utils";
import { getAchievementPercent } from "@/lib/sewing-utils";
import { qcInspectionEntryHooks, qcOrderHooks, qcReworkHooks } from "@/features/quality/service";
import { StartQcButton } from "@/features/quality/start-qc-button";
import { CreateQcOrderDialog } from "@/features/quality/create-qc-order-dialog";
import type { QcOrder, QcOrderStatus } from "@/types";

type StatusFilter = QcOrderStatus | "all";

const queueStatuses: QcOrderStatus[] = ["planned", "in_progress", "partially_completed", "on_hold", "pending_approval"];

export function QualityView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: orders = [], isLoading } = qcOrderHooks.useList();
  const { data: entries = [] } = qcInspectionEntryHooks.useList();
  const { data: reworks = [] } = qcReworkHooks.useList();

  const [tab, setTab] = useState<"queue" | "all">("queue");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const metrics = useMemo(() => {
    const active = orders.filter((o) => queueStatuses.includes(o.status));
    const pendingApproval = orders.filter((o) => o.status === "pending_approval");
    const relevant = orders.filter((o) => o.status !== "planned" && o.status !== "cancelled");
    const totalPlanned = relevant.reduce((sum, o) => sum + o.quantity, 0);
    const totalPassed = relevant.reduce((sum, o) => sum + getQcQuantitySummary(o, entries, reworks).passed, 0);
    const overallPassRate = getAchievementPercent(totalPassed, totalPlanned);
    const pendingRework = orders.reduce((sum, o) => sum + getQcQuantitySummary(o, entries, reworks).pendingRework, 0);
    return { active, pendingApproval, overallPassRate, pendingRework };
  }, [orders, entries, reworks]);

  const filteredAll = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders
      .filter((o) =>
        q
          ? o.qcOrderNumber.toLowerCase().includes(q) ||
            o.finishingOrderNumber.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.styleCode.toLowerCase().includes(q)
          : true,
      )
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  }, [orders, search, statusFilter]);

  const columns: MasterDataColumn<QcOrder>[] = [
    { key: "num", header: "QC Order", render: (o) => <span className="font-medium text-foreground">{o.qcOrderNumber}</span> },
    { key: "finishing", header: "Finishing Order", render: (o) => o.finishingOrderNumber },
    { key: "customer", header: "Customer", render: (o) => o.customerName },
    { key: "style", header: "Style", render: (o) => `${o.styleCode} · ${o.colorName}` },
    { key: "inspector", header: "Inspector", render: (o) => o.inspector ?? "—" },
    { key: "qty", header: "Qty", align: "right", render: (o) => `${o.quantity.toLocaleString()} pcs` },
    {
      key: "status",
      header: "Status",
      render: (o) => {
        const meta = qcOrderStatusMeta[o.status];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
  ];

  function renderCard(order: QcOrder) {
    const meta = qcOrderStatusMeta[order.status];
    const summary = getQcQuantitySummary(order, entries, reworks);
    return (
      <Card key={order.id} className="flex flex-col gap-2 p-4" role="button" tabIndex={0} onClick={() => router.push(`/quality/${order.id}`)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{order.qcOrderNumber}</span>
            <span className="text-xs text-muted-foreground">{order.customerName}</span>
          </div>
          <StatusBadge label={meta.label} level={meta.level} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">{order.styleCode} · {order.colorName}</span>
          <span className="font-medium text-foreground">{order.quantity.toLocaleString()} pcs</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{order.inspector ?? "Unassigned"}</span>
          <span>Passed {summary.passed.toLocaleString()} / {order.quantity.toLocaleString()}</span>
        </div>
        {summary.pendingRework > 0 && <span className="text-xs text-warning">{summary.pendingRework.toLocaleString()} pcs pending rework</span>}
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="p-5">
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Quality"
        description="Inspection, pass/fail, rework and approval — the QC workflow after Finishing"
        actions={<Button onClick={() => setCreateOpen(true)}>Create QC Order</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Overall Pass Rate" value={formatPercent(metrics.overallPassRate)} icon={CheckCircle2} accent={metrics.overallPassRate >= 95 ? "success" : "warning"} />
        <StatCard label="Active QC Orders" value={metrics.active.length.toString()} icon={ShieldCheck} accent="info" />
        <StatCard label="Pending Approval" value={metrics.pendingApproval.length.toString()} icon={ClipboardCheck} accent={metrics.pendingApproval.length > 0 ? "warning" : "success"} />
        <StatCard label="Pending Rework" value={`${metrics.pendingRework.toLocaleString()} pcs`} icon={Wrench} accent={metrics.pendingRework > 0 ? "warning" : "success"} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "queue" | "all")}>
        <TabsList>
          <TabsTrigger value="queue">Work Queue</TabsTrigger>
          <TabsTrigger value="all">All QC Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4 flex flex-col gap-3">
          {metrics.active.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="Nothing waiting on QC" description="Every QC order is either approved or cancelled." />
          ) : (
            metrics.active.map((order) => (
              <Card key={order.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className="text-sm font-semibold text-foreground hover:underline" onClick={() => router.push(`/quality/${order.id}`)}>
                      {order.qcOrderNumber}
                    </button>
                    <StatusBadge label={qcOrderStatusMeta[order.status].label} level={qcOrderStatusMeta[order.status].level} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {order.finishingOrderNumber} · {order.customerName} · {order.styleCode} · {order.colorName}
                  </span>
                  <span className="text-xs text-muted-foreground">{order.quantity.toLocaleString()} pcs · {order.inspector ?? "Unassigned"}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StartQcButton qcOrder={order} />
                  <Button variant="outline" onClick={() => router.push(`/quality/${order.id}`)}>
                    View
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 flex flex-col gap-4">
          <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search QC order, finishing order, customer or style…">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-48">
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

          {filteredAll.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No QC orders match your filters" description="Try a different search term or status." />
          ) : (
            <>
              <MasterDataTable columns={columns} rows={filteredAll} onRowClick={(o) => router.push(`/quality/${o.id}`)} />
              <MasterDataCards rows={filteredAll} renderCard={(o) => renderCard(o)} />
            </>
          )}
        </TabsContent>
      </Tabs>

      <CreateQcOrderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
