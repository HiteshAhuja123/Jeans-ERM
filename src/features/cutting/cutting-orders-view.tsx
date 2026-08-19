"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Scissors } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
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
import { formatDate } from "@/lib/format";
import { cuttingOrderStatusMeta, orderPriorityMeta } from "@/lib/status";
import { cuttingOrderHooks } from "@/features/cutting/service";
import { StartCuttingButton } from "@/features/cutting/start-cutting-button";
import type { CuttingOrder, CuttingOrderStatus } from "@/types";

type StatusFilter = CuttingOrderStatus | "all";

const queueStatuses: CuttingOrderStatus[] = ["pending", "material_check", "ready", "on_hold"];
const priorityRank: Record<CuttingOrder["priority"], number> = { urgent: 0, high: 1, normal: 2, low: 3 };

export function CuttingOrdersView() {
  const router = useRouter();
  const { data: orders = [], isLoading } = cuttingOrderHooks.useList();

  const [tab, setTab] = useState<"queue" | "all">("queue");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const queue = useMemo(
    () =>
      orders
        .filter((o) => queueStatuses.includes(o.status))
        .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || (a.plannedEnd ?? "").localeCompare(b.plannedEnd ?? "")),
    [orders],
  );

  const filteredAll = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders
      .filter((o) =>
        q
          ? o.cuttingOrderNumber.toLowerCase().includes(q) ||
            o.productionOrderNumber.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.styleCode.toLowerCase().includes(q)
          : true,
      )
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  }, [orders, search, statusFilter]);

  const columns: MasterDataColumn<CuttingOrder>[] = [
    { key: "cutNumber", header: "Cutting Order", render: (o) => <span className="font-medium text-foreground">{o.cuttingOrderNumber}</span> },
    { key: "prodOrder", header: "Production Order", render: (o) => o.productionOrderNumber },
    { key: "customer", header: "Customer", render: (o) => o.customerName },
    { key: "style", header: "Style", render: (o) => `${o.styleCode} · ${o.colorName}` },
    { key: "qty", header: "Qty", align: "right", render: (o) => `${o.requiredQuantity.toLocaleString()} pcs` },
    {
      key: "priority",
      header: "Priority",
      render: (o) => {
        const meta = orderPriorityMeta[o.priority];
        return <StatusBadge label={meta.label} level={meta.level} hideIcon />;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (o) => {
        const meta = cuttingOrderStatusMeta[o.status];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
    { key: "delivery", header: "Planned End", align: "right", render: (o) => (o.plannedEnd ? formatDate(o.plannedEnd) : "—") },
  ];

  function renderCard(order: CuttingOrder, showAction: boolean) {
    const statusMeta = cuttingOrderStatusMeta[order.status];
    const priorityMeta = orderPriorityMeta[order.priority];
    return (
      <Card key={order.id} className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2" onClick={() => router.push(`/cutting/orders/${order.id}`)} role="button" tabIndex={0}>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{order.cuttingOrderNumber}</span>
            <span className="text-xs text-muted-foreground">{order.customerName}</span>
          </div>
          <StatusBadge label={statusMeta.label} level={statusMeta.level} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">
            {order.styleCode} · {order.colorName}
          </span>
          <span className="font-medium text-foreground">{order.requiredQuantity.toLocaleString()} pcs</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{order.plannedEnd ? `Due ${formatDate(order.plannedEnd)}` : "No date set"}</span>
          <StatusBadge label={priorityMeta.label} level={priorityMeta.level} hideIcon />
        </div>
        {showAction && (
          <div className="flex items-center gap-2 pt-1">
            <StartCuttingButton cuttingOrder={order} size="sm" />
            <Button variant="outline" size="sm" onClick={() => router.push(`/cutting/orders/${order.id}`)}>
              View
            </Button>
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Cutting Orders" description="Production orders ready or waiting for cutting, and the full cutting order history" />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "queue" | "all")}>
        <TabsList>
          <TabsTrigger value="queue">Work Queue</TabsTrigger>
          <TabsTrigger value="all">All Cutting Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4 flex flex-col gap-4">
          {isLoading ? (
            <Card className="flex flex-col gap-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </Card>
          ) : queue.length === 0 ? (
            <EmptyState icon={Scissors} title="Nothing waiting on cutting" description="Every cutting order is either in progress or completed." />
          ) : (
            <div className="flex flex-col gap-3">
              {queue.map((order) => {
                const statusMeta = cuttingOrderStatusMeta[order.status];
                const priorityMeta = orderPriorityMeta[order.priority];
                return (
                  <Card key={order.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" className="text-sm font-semibold text-foreground hover:underline" onClick={() => router.push(`/cutting/orders/${order.id}`)}>
                          {order.cuttingOrderNumber}
                        </button>
                        <StatusBadge label={statusMeta.label} level={statusMeta.level} />
                        <StatusBadge label={priorityMeta.label} level={priorityMeta.level} hideIcon />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {order.productionOrderNumber} · {order.customerName} · {order.styleCode} · {order.colorName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {order.requiredQuantity.toLocaleString()} pcs
                        {order.plannedEnd ? ` · Due ${formatDate(order.plannedEnd)}` : ""}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StartCuttingButton cuttingOrder={order} />
                      <Button variant="outline" onClick={() => router.push(`/cutting/orders/${order.id}`)}>
                        View
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 flex flex-col gap-4">
          <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search cutting order, production order, customer or style…">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(cuttingOrderStatusMeta).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBar>

          {isLoading ? (
            <Card className="flex flex-col gap-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </Card>
          ) : filteredAll.length === 0 ? (
            <EmptyState icon={Scissors} title="No cutting orders match your filters" description="Try a different search term or status." />
          ) : (
            <>
              <MasterDataTable columns={columns} rows={filteredAll} onRowClick={(o) => router.push(`/cutting/orders/${o.id}`)} />
              <MasterDataCards rows={filteredAll} renderCard={(o) => renderCard(o, false)} />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
