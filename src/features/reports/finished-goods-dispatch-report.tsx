"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PackageCheck, Ship, Truck } from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MasterDataTable, type MasterDataColumn } from "@/components/shared/master-data-table";
import { MasterDataCards } from "@/components/shared/master-data-cards";
import { Pagination, usePagination } from "@/components/shared/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { dispatchOrderStatusMeta } from "@/lib/status";
import { getFinishedGoodsAvailable } from "@/lib/finished-goods-utils";
import { getOrderFulfillmentSummary, type OrderFulfillmentSummary } from "@/lib/dispatch-utils";
import { orderHooks } from "@/features/orders/service";
import { finishedGoodsHooks } from "@/features/inventory/finished-goods-service";
import { dispatchOrderHooks } from "@/features/dispatch/service";
import type { DispatchOrder, Order } from "@/types";

const stageLabels: Record<OrderFulfillmentSummary["stage"], string> = {
  awaiting_stock: "Awaiting Stock",
  ready_for_dispatch: "Ready for Dispatch",
  partially_dispatched: "Partially Dispatched",
  dispatched: "Dispatched",
};

type StageFilter = OrderFulfillmentSummary["stage"] | "all";

export function FinishedGoodsDispatchReport() {
  const router = useRouter();
  const { data: orders = [] } = orderHooks.useList();
  const { data: fgBalances = [] } = finishedGoodsHooks.useList();
  const { data: dispatchOrders = [] } = dispatchOrderHooks.useList();

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");

  const fulfillment = useMemo(() => {
    return orders
      .map((order) => ({ id: order.id, order, summary: getOrderFulfillmentSummary(order, fgBalances) }))
      .filter((r) => r.summary.packedQty > 0 || r.summary.dispatchedQty > 0);
  }, [orders, fgBalances]);

  const stats = useMemo(() => {
    const finishedGoodsAvailable = fgBalances.reduce((sum, b) => sum + getFinishedGoodsAvailable(b), 0);
    const totalDispatched = fgBalances.reduce((sum, b) => sum + b.dispatched, 0);
    const readyForDispatch = fulfillment.filter((r) => r.summary.stage === "ready_for_dispatch").length;
    const partiallyDispatched = fulfillment.filter((r) => r.summary.stage === "partially_dispatched").length;
    return { finishedGoodsAvailable, totalDispatched, readyForDispatch, partiallyDispatched };
  }, [fgBalances, fulfillment]);

  const filteredFulfillment = useMemo(() => {
    const q = search.trim().toLowerCase();
    return fulfillment
      .filter((r) => (q ? r.order.orderNumber.toLowerCase().includes(q) || r.order.customerName.toLowerCase().includes(q) : true))
      .filter((r) => stageFilter === "all" || r.summary.stage === stageFilter)
      .sort((a, b) => b.summary.availableQty - a.summary.availableQty);
  }, [fulfillment, search, stageFilter]);

  const { page, pageCount, pageRows, setPage, pageSize, totalCount } = usePagination(filteredFulfillment, 10);

  const recentDispatches = useMemo(() => [...dispatchOrders].sort((a, b) => b.dispatchDate.localeCompare(a.dispatchDate)).slice(0, 8), [dispatchOrders]);

  const columns: MasterDataColumn<{ id: string; order: Order; summary: OrderFulfillmentSummary }>[] = [
    { key: "order", header: "Order", render: (r) => <span className="font-medium text-foreground">{r.order.orderNumber}</span> },
    { key: "customer", header: "Customer", render: (r) => r.order.customerName },
    { key: "ordered", header: "Ordered", align: "right", render: (r) => r.summary.orderedQty.toLocaleString() },
    { key: "available", header: "Available", align: "right", render: (r) => r.summary.availableQty.toLocaleString() },
    { key: "dispatched", header: "Dispatched", align: "right", render: (r) => r.summary.dispatchedQty.toLocaleString() },
    { key: "remaining", header: "Remaining", align: "right", render: (r) => r.summary.remainingQty.toLocaleString() },
    { key: "stage", header: "Stage", render: (r) => stageLabels[r.summary.stage] },
  ];

  const dispatchColumns: MasterDataColumn<DispatchOrder>[] = [
    { key: "num", header: "Dispatch", render: (d) => <span className="font-medium text-foreground">{d.dispatchOrderNumber}</span> },
    { key: "order", header: "Order", render: (d) => d.orderNumber },
    { key: "customer", header: "Customer", render: (d) => d.customerName },
    { key: "qty", header: "Qty", align: "right", render: (d) => d.quantity.toLocaleString() },
    { key: "status", header: "Status", render: (d) => <StatusBadge label={dispatchOrderStatusMeta[d.status].label} level={dispatchOrderStatusMeta[d.status].level} /> },
    { key: "date", header: "Date", align: "right", render: (d) => formatDate(d.dispatchDate) },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Finished Goods Available" value={stats.finishedGoodsAvailable.toLocaleString()} icon={PackageCheck} accent={stats.finishedGoodsAvailable > 0 ? "info" : "neutral"} href="/inventory/finished-goods" />
        <StatCard label="Total Dispatched" value={stats.totalDispatched.toLocaleString()} icon={Ship} />
        <StatCard label="Ready for Dispatch" value={stats.readyForDispatch.toString()} icon={CheckCircle2} accent={stats.readyForDispatch > 0 ? "info" : "neutral"} />
        <StatCard label="Partially Dispatched" value={stats.partiallyDispatched.toString()} icon={Truck} accent={stats.partiallyDispatched > 0 ? "warning" : "success"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Fulfillment</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search order or customer…">
            <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as StageFilter)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Fulfillment stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {Object.entries(stageLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBar>

          {filteredFulfillment.length === 0 ? (
            <EmptyState icon={PackageCheck} title="No orders match your filters" description="Orders with Finished Goods stock will appear here." />
          ) : (
            <>
              <MasterDataTable columns={columns} rows={pageRows} onRowClick={(r) => router.push(`/orders/${r.order.id}`)} />
              <MasterDataCards
                rows={pageRows}
                renderCard={(r) => (
                  <Card key={r.order.id} className="flex flex-col gap-2 p-4" onClick={() => router.push(`/orders/${r.order.id}`)}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground">{r.order.orderNumber}</span>
                      <span className="text-xs text-muted-foreground">{stageLabels[r.summary.stage]}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{r.order.customerName}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.summary.dispatchedQty.toLocaleString()} / {r.summary.orderedQty.toLocaleString()} dispatched · {r.summary.availableQty.toLocaleString()} available
                    </span>
                  </Card>
                )}
              />
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} totalCount={totalCount} pageSize={pageSize} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Dispatches</CardTitle>
        </CardHeader>
        <CardContent>
          {recentDispatches.length === 0 ? (
            <EmptyState icon={Ship} title="No dispatches yet" description="Dispatch orders will appear here once shipments are recorded." />
          ) : (
            <>
              <MasterDataTable columns={dispatchColumns} rows={recentDispatches} onRowClick={(d) => router.push(`/dispatch/${d.id}`)} />
              <MasterDataCards
                rows={recentDispatches}
                renderCard={(d) => (
                  <Card key={d.id} className="flex items-center justify-between p-4" onClick={() => router.push(`/dispatch/${d.id}`)}>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{d.dispatchOrderNumber}</span>
                      <span className="text-xs text-muted-foreground">{d.customerName} · {d.quantity.toLocaleString()} pcs</span>
                    </div>
                    <StatusBadge label={dispatchOrderStatusMeta[d.status].label} level={dispatchOrderStatusMeta[d.status].level} />
                  </Card>
                )}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
