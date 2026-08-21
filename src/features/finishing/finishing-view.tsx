"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, PackageCheck, Shirt, Timer } from "lucide-react";

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
import { finishingOrderStatusMeta } from "@/lib/status";
import { getFinishingOrderQuantitySummary } from "@/lib/post-sewing-utils";
import { finishingEntryHooks, finishingOrderHooks } from "@/features/finishing/service";
import { StartFinishingButton } from "@/features/finishing/start-finishing-button";
import { CreateFinishingOrderDialog } from "@/features/finishing/create-finishing-order-dialog";
import type { FinishingOrder, FinishingOrderStatus } from "@/types";

type StatusFilter = FinishingOrderStatus | "all";

const queueStatuses: FinishingOrderStatus[] = ["planned", "in_progress", "partially_completed", "on_hold"];

export function FinishingView() {
  const router = useRouter();
  const { data: orders = [], isLoading } = finishingOrderHooks.useList();
  const { data: entries = [] } = finishingEntryHooks.useList();

  const [tab, setTab] = useState<"queue" | "all">("queue");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const metrics = useMemo(() => {
    const active = orders.filter((o) => queueStatuses.includes(o.status));
    const onHold = orders.filter((o) => o.status === "on_hold");
    const totalIssue = entries.reduce((sum, e) => sum + e.issueQuantity, 0);
    const totalOutput = entries.reduce((sum, e) => sum + e.outputQuantity, 0);
    return { active, onHold, totalIssue, totalOutput };
  }, [orders, entries]);

  const filteredAll = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders
      .filter((o) =>
        q
          ? o.finishingOrderNumber.toLowerCase().includes(q) ||
            o.processingOrderNumber.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.styleCode.toLowerCase().includes(q)
          : true,
      )
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  }, [orders, search, statusFilter]);

  const columns: MasterDataColumn<FinishingOrder>[] = [
    { key: "num", header: "Finishing Order", render: (o) => <span className="font-medium text-foreground">{o.finishingOrderNumber}</span> },
    { key: "processing", header: "Processing Order", render: (o) => o.processingOrderNumber },
    { key: "customer", header: "Customer", render: (o) => o.customerName },
    { key: "style", header: "Style", render: (o) => `${o.styleCode} · ${o.colorName}` },
    { key: "responsible", header: "Responsible", render: (o) => o.responsible ?? "—" },
    { key: "qty", header: "Qty", align: "right", render: (o) => `${o.quantity.toLocaleString()} pcs` },
    {
      key: "status",
      header: "Status",
      render: (o) => {
        const meta = finishingOrderStatusMeta[o.status];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
  ];

  function renderCard(order: FinishingOrder) {
    const meta = finishingOrderStatusMeta[order.status];
    const summary = getFinishingOrderQuantitySummary(order, entries.filter((e) => e.finishingOrderId === order.id));
    return (
      <Card key={order.id} className="flex flex-col gap-2 p-4" role="button" tabIndex={0} onClick={() => router.push(`/finishing/${order.id}`)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{order.finishingOrderNumber}</span>
            <span className="text-xs text-muted-foreground">{order.customerName}</span>
          </div>
          <StatusBadge label={meta.label} level={meta.level} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">{order.styleCode} · {order.colorName}</span>
          <span className="font-medium text-foreground">{order.quantity.toLocaleString()} pcs</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{order.responsible ?? "Unassigned"}</span>
          <span>Output {summary.output.toLocaleString()} / {order.quantity.toLocaleString()}</span>
        </div>
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
        title="Finishing"
        description="Pressing, trimming and final finishing work coming from Processing"
        actions={<Button onClick={() => setCreateOpen(true)}>Create Finishing Order</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Orders" value={metrics.active.length.toString()} icon={Shirt} accent="info" />
        <StatCard label="Good Output" value={`${metrics.totalOutput.toLocaleString()} pcs`} icon={PackageCheck} accent="success" />
        <StatCard label="Issues Flagged" value={`${metrics.totalIssue.toLocaleString()} pcs`} icon={Timer} accent={metrics.totalIssue > 0 ? "warning" : "success"} />
        <StatCard label="On Hold" value={metrics.onHold.length.toString()} icon={AlertTriangle} accent={metrics.onHold.length > 0 ? "warning" : "success"} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "queue" | "all")}>
        <TabsList>
          <TabsTrigger value="queue">Work Queue</TabsTrigger>
          <TabsTrigger value="all">All Finishing Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4 flex flex-col gap-3">
          {metrics.active.length === 0 ? (
            <EmptyState icon={PackageCheck} title="Nothing waiting on finishing" description="Every finishing order is either completed or cancelled." />
          ) : (
            metrics.active.map((order) => (
              <Card key={order.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className="text-sm font-semibold text-foreground hover:underline" onClick={() => router.push(`/finishing/${order.id}`)}>
                      {order.finishingOrderNumber}
                    </button>
                    <StatusBadge label={finishingOrderStatusMeta[order.status].label} level={finishingOrderStatusMeta[order.status].level} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {order.processingOrderNumber} · {order.customerName} · {order.styleCode} · {order.colorName}
                  </span>
                  <span className="text-xs text-muted-foreground">{order.quantity.toLocaleString()} pcs · {order.responsible ?? "Unassigned"}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StartFinishingButton finishingOrder={order} />
                  <Button variant="outline" onClick={() => router.push(`/finishing/${order.id}`)}>
                    View
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 flex flex-col gap-4">
          <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search finishing order, processing order, customer or style…">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(finishingOrderStatusMeta).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBar>

          {filteredAll.length === 0 ? (
            <EmptyState icon={Shirt} title="No finishing orders match your filters" description="Try a different search term or status." />
          ) : (
            <>
              <MasterDataTable columns={columns} rows={filteredAll} onRowClick={(o) => router.push(`/finishing/${o.id}`)} />
              <MasterDataCards rows={filteredAll} renderCard={(o) => renderCard(o)} />
            </>
          )}
        </TabsContent>
      </Tabs>

      <CreateFinishingOrderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
