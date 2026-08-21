"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Droplets, PackageCheck, Timer, Truck } from "lucide-react";

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
import { processingOrderStatusMeta } from "@/lib/status";
import { getProcessingQuantitySummary } from "@/lib/post-sewing-utils";
import { processingOrderHooks, processingTransactionHooks } from "@/features/processing/service";
import { CreateProcessingOrderDialog } from "@/features/processing/create-processing-order-dialog";
import type { ProcessingOrder, ProcessingOrderStatus } from "@/types";

type StatusFilter = ProcessingOrderStatus | "all";

const queueStatuses: ProcessingOrderStatus[] = ["planned", "in_progress", "partially_received", "on_hold"];

export function ProcessingView() {
  const router = useRouter();
  const { data: orders = [], isLoading } = processingOrderHooks.useList();
  const { data: transactions = [] } = processingTransactionHooks.useList();

  const [tab, setTab] = useState<"queue" | "all">("queue");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const metrics = useMemo(() => {
    const active = orders.filter((o) => queueStatuses.includes(o.status));
    const outsourced = active.filter((o) => o.mode === "outsourced");
    const onHold = orders.filter((o) => o.status === "on_hold");
    const inProcess = orders.reduce((sum, o) => sum + getProcessingQuantitySummary(o, transactions.filter((t) => t.processingOrderId === o.id)).inProcess, 0);
    const completedThisWeek = orders.filter((o) => o.status === "completed").length;
    return { active, outsourced, onHold, inProcess, completedThisWeek };
  }, [orders, transactions]);

  const filteredAll = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders
      .filter((o) =>
        q
          ? o.processingOrderNumber.toLowerCase().includes(q) ||
            o.sewingOrderNumber.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.styleCode.toLowerCase().includes(q) ||
            (o.vendorName ?? "").toLowerCase().includes(q)
          : true,
      )
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  }, [orders, search, statusFilter]);

  const columns: MasterDataColumn<ProcessingOrder>[] = [
    { key: "num", header: "Processing Order", render: (o) => <span className="font-medium text-foreground">{o.processingOrderNumber}</span> },
    { key: "sewing", header: "Sewing Order", render: (o) => o.sewingOrderNumber },
    { key: "customer", header: "Customer", render: (o) => o.customerName },
    { key: "style", header: "Style", render: (o) => `${o.styleCode} · ${o.colorName}` },
    { key: "type", header: "Type", render: (o) => o.processingTypeName },
    { key: "mode", header: "Mode", render: (o) => (o.mode === "outsourced" ? o.vendorName ?? "Outsourced" : "Internal") },
    { key: "qty", header: "Qty", align: "right", render: (o) => `${o.quantity.toLocaleString()} pcs` },
    {
      key: "status",
      header: "Status",
      render: (o) => {
        const meta = processingOrderStatusMeta[o.status];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
  ];

  function renderCard(order: ProcessingOrder) {
    const meta = processingOrderStatusMeta[order.status];
    const summary = getProcessingQuantitySummary(order, transactions.filter((t) => t.processingOrderId === order.id));
    return (
      <Card key={order.id} className="flex flex-col gap-2 p-4" role="button" tabIndex={0} onClick={() => router.push(`/processing/${order.id}`)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{order.processingOrderNumber}</span>
            <span className="text-xs text-muted-foreground">{order.customerName} · {order.processingTypeName}</span>
          </div>
          <StatusBadge label={meta.label} level={meta.level} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">{order.styleCode} · {order.colorName}</span>
          <span className="font-medium text-foreground">{order.quantity.toLocaleString()} pcs</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{order.mode === "outsourced" ? order.vendorName : "Internal"}</span>
          <span>Received {summary.received.toLocaleString()} / {order.quantity.toLocaleString()}</span>
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
        title="Processing"
        description="Washing/processing work — internal and outsourced batches coming from Sewing"
        actions={<Button onClick={() => setCreateOpen(true)}>Create Processing Order</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Orders" value={metrics.active.length.toString()} icon={Droplets} accent="info" />
        <StatCard label="Outsourced Active" value={metrics.outsourced.length.toString()} icon={Truck} accent="info" />
        <StatCard label="In Process" value={`${metrics.inProcess.toLocaleString()} pcs`} icon={Timer} accent="warning" />
        <StatCard label="On Hold" value={metrics.onHold.length.toString()} icon={AlertTriangle} accent={metrics.onHold.length > 0 ? "warning" : "success"} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "queue" | "all")}>
        <TabsList>
          <TabsTrigger value="queue">Work Queue</TabsTrigger>
          <TabsTrigger value="all">All Processing Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4 flex flex-col gap-3">
          {metrics.active.length === 0 ? (
            <EmptyState icon={PackageCheck} title="Nothing waiting on processing" description="Every processing order is either completed or cancelled." />
          ) : (
            metrics.active.map((order) => renderCard(order))
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 flex flex-col gap-4">
          <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search processing order, sewing order, customer, style or vendor…">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(processingOrderStatusMeta).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBar>

          {filteredAll.length === 0 ? (
            <EmptyState icon={Droplets} title="No processing orders match your filters" description="Try a different search term or status." />
          ) : (
            <>
              <MasterDataTable columns={columns} rows={filteredAll} onRowClick={(o) => router.push(`/processing/${o.id}`)} />
              <MasterDataCards rows={filteredAll} renderCard={(o) => renderCard(o)} />
            </>
          )}
        </TabsContent>
      </Tabs>

      <CreateProcessingOrderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
