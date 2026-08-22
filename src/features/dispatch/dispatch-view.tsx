"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Package, PackageCheck, Ship, Truck } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { MasterDataTable, type MasterDataColumn } from "@/components/shared/master-data-table";
import { MasterDataCards } from "@/components/shared/master-data-cards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { dispatchOrderStatusMeta } from "@/lib/status";
import { getFinishedGoodsAvailable } from "@/lib/finished-goods-utils";
import { getOrderFulfillmentSummary } from "@/lib/dispatch-utils";
import { getQcOrderAvailableForPacking } from "@/lib/packing-utils";
import { dispatchOrderHooks } from "@/features/dispatch/service";
import { CreateDispatchDialog } from "@/features/dispatch/create-dispatch-dialog";
import { finishedGoodsHooks } from "@/features/inventory/finished-goods-service";
import { packingOrderHooks } from "@/features/packing/service";
import { qcInspectionEntryHooks, qcOrderHooks, qcReworkHooks } from "@/features/quality/service";
import { orderHooks } from "@/features/orders/service";
import type { DispatchOrder, DispatchOrderStatus } from "@/types";

type StatusFilter = DispatchOrderStatus | "all";

export function DispatchView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: dispatchOrders = [], isLoading } = dispatchOrderHooks.useList();
  const { data: fgBalances = [] } = finishedGoodsHooks.useList();
  const { data: packingOrders = [] } = packingOrderHooks.useList();
  const { data: qcOrders = [] } = qcOrderHooks.useList();
  const { data: qcEntries = [] } = qcInspectionEntryHooks.useList();
  const { data: qcReworks = [] } = qcReworkHooks.useList();
  const { data: orders = [] } = orderHooks.useList();

  const [tab, setTab] = useState<"queue" | "all">("queue");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [createOpen, setCreateOpen] = useState(Boolean(searchParams.get("orderId")));

  const metrics = useMemo(() => {
    const readyForPacking = qcOrders.filter((q) => getQcOrderAvailableForPacking(q, qcEntries, qcReworks, packingOrders) > 0).length;
    const packingInProgress = packingOrders.filter((p) => p.status === "in_progress" || p.status === "partially_packed").length;
    const packed = packingOrders.filter((p) => p.status === "packed").length;
    const fgAvailable = fgBalances.reduce((sum, b) => sum + getFinishedGoodsAvailable(b), 0);

    const summaries = orders.map((o) => getOrderFulfillmentSummary(o, fgBalances));
    const readyForDispatch = summaries.filter((s) => s.stage === "ready_for_dispatch").length;
    const partiallyDispatched = summaries.filter((s) => s.stage === "partially_dispatched").length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentlyDispatched = dispatchOrders.filter((d) => d.status !== "cancelled" && new Date(d.dispatchDate) >= sevenDaysAgo).length;

    return { readyForPacking, packingInProgress, packed, fgAvailable, readyForDispatch, partiallyDispatched, recentlyDispatched };
  }, [qcOrders, qcEntries, qcReworks, packingOrders, fgBalances, orders, dispatchOrders]);

  const readyOrders = useMemo(() => {
    return orders
      .map((o) => ({ order: o, summary: getOrderFulfillmentSummary(o, fgBalances) }))
      .filter((r) => r.summary.stage === "ready_for_dispatch" || r.summary.stage === "partially_dispatched")
      .sort((a, b) => b.summary.availableQty - a.summary.availableQty);
  }, [orders, fgBalances]);

  const filteredAll = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dispatchOrders
      .filter((d) => (q ? d.dispatchOrderNumber.toLowerCase().includes(q) || d.orderNumber.toLowerCase().includes(q) || d.customerName.toLowerCase().includes(q) : true))
      .filter((d) => statusFilter === "all" || d.status === statusFilter)
      .sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  }, [dispatchOrders, search, statusFilter]);

  const columns: MasterDataColumn<DispatchOrder>[] = [
    { key: "num", header: "Dispatch Order", render: (d) => <span className="font-medium text-foreground">{d.dispatchOrderNumber}</span> },
    { key: "order", header: "Order", render: (d) => d.orderNumber },
    { key: "customer", header: "Customer", render: (d) => d.customerName },
    { key: "qty", header: "Qty", align: "right", render: (d) => `${d.quantity.toLocaleString()} pcs` },
    { key: "carrier", header: "Carrier", render: (d) => d.carrier ?? "—" },
    {
      key: "status",
      header: "Status",
      render: (d) => {
        const meta = dispatchOrderStatusMeta[d.status];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
    { key: "date", header: "Dispatch Date", align: "right", render: (d) => formatDate(d.dispatchDate) },
  ];

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
        title="Fulfillment Dashboard"
        description="Packing, finished goods and dispatch — from QC approval to delivery"
        actions={<Button onClick={() => setCreateOpen(true)}>Create Dispatch</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Ready for Packing" value={metrics.readyForPacking.toString()} icon={Package} href="/packing" />
        <StatCard label="Packing In Progress" value={metrics.packingInProgress.toString()} icon={Package} accent="info" href="/packing" />
        <StatCard label="Packed" value={metrics.packed.toString()} icon={PackageCheck} accent="success" href="/packing" />
        <StatCard label="Finished Goods Available" value={metrics.fgAvailable.toLocaleString()} icon={PackageCheck} accent={metrics.fgAvailable > 0 ? "info" : "neutral"} href="/inventory/finished-goods" />
        <StatCard label="Ready for Dispatch" value={metrics.readyForDispatch.toString()} icon={Ship} accent={metrics.readyForDispatch > 0 ? "info" : "neutral"} />
        <StatCard label="Partially Dispatched" value={metrics.partiallyDispatched.toString()} icon={Truck} accent={metrics.partiallyDispatched > 0 ? "warning" : "success"} />
        <StatCard label="Recently Dispatched" value={metrics.recentlyDispatched.toString()} icon={CheckCircle2} helpText="Last 7 days" />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "queue" | "all")}>
        <TabsList>
          <TabsTrigger value="queue">Ready for Dispatch</TabsTrigger>
          <TabsTrigger value="all">All Dispatches</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4 flex flex-col gap-3">
          {readyOrders.length === 0 ? (
            <EmptyState icon={Ship} title="Nothing ready for dispatch" description="Orders will appear here once Finished Goods stock is available." />
          ) : (
            readyOrders.map(({ order, summary }) => (
              <Card key={order.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className="text-sm font-semibold text-foreground hover:underline" onClick={() => router.push(`/orders/${order.id}`)}>
                      {order.orderNumber}
                    </button>
                    <StatusBadge
                      label={summary.stage === "partially_dispatched" ? "Partially Dispatched" : "Ready for Dispatch"}
                      level={summary.stage === "partially_dispatched" ? "warning" : "info"}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{order.customerName}</span>
                  <span className="text-xs text-muted-foreground">
                    {summary.availableQty.toLocaleString()} pcs available · {summary.dispatchedQty.toLocaleString()} / {summary.orderedQty.toLocaleString()} dispatched
                  </span>
                </div>
                <Button
                  onClick={() => {
                    setCreateOpen(true);
                    router.replace(`/dispatch?orderId=${order.id}`, { scroll: false });
                  }}
                >
                  Create Dispatch
                </Button>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 flex flex-col gap-4">
          <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search dispatch order, customer order or customer…">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(dispatchOrderStatusMeta).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBar>

          {filteredAll.length === 0 ? (
            <EmptyState icon={Ship} title="No dispatches match your filters" description="Try a different search term or status." />
          ) : (
            <>
              <MasterDataTable columns={columns} rows={filteredAll} onRowClick={(d) => router.push(`/dispatch/${d.id}`)} />
              <MasterDataCards
                rows={filteredAll}
                renderCard={(d) => {
                  const meta = dispatchOrderStatusMeta[d.status];
                  return (
                    <Card key={d.id} className="flex flex-col gap-2 p-4" role="button" tabIndex={0} onClick={() => router.push(`/dispatch/${d.id}`)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{d.dispatchOrderNumber}</span>
                          <span className="text-xs text-muted-foreground">{d.customerName}</span>
                        </div>
                        <StatusBadge label={meta.label} level={meta.level} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{d.orderNumber}</span>
                        <span className="font-medium text-foreground">{d.quantity.toLocaleString()} pcs</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{d.carrier ?? "No carrier assigned"}</span>
                        <span>{formatDate(d.dispatchDate)}</span>
                      </div>
                    </Card>
                  );
                }}
              />
            </>
          )}
        </TabsContent>
      </Tabs>

      <CreateDispatchDialog
        open={createOpen}
        onOpenChange={(next) => {
          setCreateOpen(next);
          if (!next) router.replace("/dispatch", { scroll: false });
        }}
        initialOrderId={searchParams.get("orderId") ?? undefined}
      />
    </div>
  );
}
