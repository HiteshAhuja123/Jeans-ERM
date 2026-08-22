"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Boxes, CheckCircle2, Package } from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { LabeledProgress } from "@/components/shared/labeled-progress";
import { EmptyState } from "@/components/shared/empty-state";
import { MasterDataTable, type MasterDataColumn } from "@/components/shared/master-data-table";
import { MasterDataCards } from "@/components/shared/master-data-cards";
import { Pagination, usePagination } from "@/components/shared/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { productionOrderStatusMeta } from "@/lib/status";
import { getBottleneckStage, getProductionInsights, getStageLoad } from "@/lib/insights-utils";
import { productionOrderHooks } from "@/features/production/service";
import { customerHooks } from "@/features/customers/service";
import { ProductionTrendChart } from "@/features/dashboard/production-trend-chart";
import { mockDailyProduction, productionStageLabels } from "@/mock-data";
import type { ProductionOrder, ProductionOrderStatus } from "@/types";

type StatusFilter = ProductionOrderStatus | "all";

export function OrdersProductionReport() {
  const router = useRouter();
  const { data: productionOrders = [] } = productionOrderHooks.useList();
  const { data: customers = [] } = customerHooks.useList();

  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const weekOut = new Date();
  weekOut.setDate(weekOut.getDate() + 7);
  const weekOutStr = weekOut.toISOString().slice(0, 10);

  const insights = useMemo(() => getProductionInsights(productionOrders, today, weekOutStr), [productionOrders, today, weekOutStr]);
  const stageLoads = useMemo(() => getStageLoad(productionOrders), [productionOrders]);
  const bottleneck = useMemo(() => getBottleneckStage(productionOrders), [productionOrders]);
  const maxStageCount = Math.max(1, ...stageLoads.map((s) => s.count));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return productionOrders
      .filter((po) =>
        q ? po.productionOrderNumber.toLowerCase().includes(q) || po.orderNumber.toLowerCase().includes(q) || po.styleCode.toLowerCase().includes(q) : true,
      )
      .filter((po) => customerFilter === "all" || po.customerId === customerFilter)
      .filter((po) => statusFilter === "all" || po.status === statusFilter)
      .filter((po) => !fromDate || po.plannedStart >= fromDate)
      .filter((po) => !toDate || po.plannedEnd <= toDate)
      .sort((a, b) => b.plannedStart.localeCompare(a.plannedStart));
  }, [productionOrders, search, customerFilter, statusFilter, fromDate, toDate]);

  const { page, pageCount, pageRows, setPage, pageSize, totalCount } = usePagination(filtered, 10);

  const columns: MasterDataColumn<ProductionOrder>[] = [
    { key: "num", header: "Production Order", render: (po) => <span className="font-medium text-foreground">{po.productionOrderNumber}</span> },
    { key: "order", header: "Order", render: (po) => po.orderNumber },
    { key: "customer", header: "Customer", render: (po) => po.customerName },
    { key: "style", header: "Style", render: (po) => `${po.styleCode} · ${po.colorName}` },
    {
      key: "progress",
      header: "Planned vs Produced",
      render: (po) => <LabeledProgress label="" current={po.quantityProduced} total={po.quantity} compact level={po.quantityProduced >= po.quantity ? "success" : "info"} />,
    },
    { key: "stage", header: "Stage", render: (po) => productionStageLabels[po.currentStage] },
    {
      key: "status",
      header: "Status",
      render: (po) => {
        const meta = productionOrderStatusMeta[po.status];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Production Orders" value={insights.active.length.toString()} icon={Boxes} />
        <StatCard label="Pending Production" value={insights.pending.length.toString()} icon={Package} accent="info" />
        <StatCard label="Delayed" value={insights.delayed.length.toString()} icon={AlertTriangle} accent={insights.delayed.length > 0 ? "critical" : "success"} />
        <StatCard label="Completed" value={insights.completed.length.toString()} icon={CheckCircle2} accent="success" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Production — Last 14 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductionTrendChart data={mockDailyProduction} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Where orders are backed up</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {bottleneck && (
              <p className="rounded-lg border border-warning/25 bg-warning-subtle px-3 py-2 text-sm text-warning">
                {productionStageLabels[bottleneck.stage]} currently has the most active orders ({bottleneck.count}).
              </p>
            )}
            {stageLoads.map((s) => (
              <div key={s.stage} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-sm text-foreground">{productionStageLabels[s.stage]}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${s.count} orders at ${productionStageLabels[s.stage]}`}>
                  <div
                    className={bottleneck?.stage === s.stage ? "h-full rounded-full bg-warning" : "h-full rounded-full bg-info"}
                    style={{ width: `${(s.count / maxStageCount) * 100}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{s.count} orders</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search production order, order # or style…">
        <Select value={customerFilter} onValueChange={setCustomerFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All customers</SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(productionOrderStatusMeta).map(([value, meta]) => (
              <SelectItem key={value} value={value}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Label htmlFor="orders-report-from" className="text-xs text-muted-foreground">
            From
          </Label>
          <Input id="orders-report-from" type="date" className="w-full sm:w-36" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="orders-report-to" className="text-xs text-muted-foreground">
            To
          </Label>
          <Input id="orders-report-to" type="date" className="w-full sm:w-36" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="No production orders match your filters" description="Try a different date range, customer or status." />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={pageRows} onRowClick={(po) => router.push(`/production/orders/${po.id}`)} />
          <MasterDataCards
            rows={pageRows}
            renderCard={(po) => {
              const meta = productionOrderStatusMeta[po.status];
              return (
                <Card key={po.id} className="flex flex-col gap-2 p-4" onClick={() => router.push(`/production/orders/${po.id}`)}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">{po.productionOrderNumber}</span>
                    <StatusBadge label={meta.label} level={meta.level} />
                  </div>
                  <span className="text-xs text-muted-foreground">{po.customerName} · {po.styleCode}</span>
                  <LabeledProgress label="Produced" current={po.quantityProduced} total={po.quantity} compact />
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
