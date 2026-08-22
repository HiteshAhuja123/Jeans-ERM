"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Package, PackageCheck, Timer } from "lucide-react";

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
import { packingOrderStatusMeta } from "@/lib/status";
import { getPackingOrderQuantitySummary } from "@/lib/packing-utils";
import { packingEntryHooks, packingOrderHooks } from "@/features/packing/service";
import { StartPackingButton } from "@/features/packing/start-packing-button";
import { CreatePackingOrderDialog } from "@/features/packing/create-packing-order-dialog";
import type { PackingOrder, PackingOrderStatus } from "@/types";

type StatusFilter = PackingOrderStatus | "all";

const queueStatuses: PackingOrderStatus[] = ["planned", "in_progress", "partially_packed", "on_hold"];

export function PackingView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: orders = [], isLoading } = packingOrderHooks.useList();
  const { data: entries = [] } = packingEntryHooks.useList();

  const [tab, setTab] = useState<"queue" | "all">(searchParams.get("q") ? "all" : "queue");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [createOpen, setCreateOpen] = useState(Boolean(searchParams.get("qcOrderId")));

  const metrics = useMemo(() => {
    const active = orders.filter((o) => queueStatuses.includes(o.status));
    const onHold = orders.filter((o) => o.status === "on_hold");
    const totalPacked = entries.reduce((sum, e) => sum + e.packedQuantity, 0);
    const totalCartons = entries.reduce((sum, e) => sum + e.cartonCount, 0);
    return { active, onHold, totalPacked, totalCartons };
  }, [orders, entries]);

  const filteredAll = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders
      .filter((o) =>
        q
          ? o.packingOrderNumber.toLowerCase().includes(q) ||
            o.qcOrderNumber.toLowerCase().includes(q) ||
            o.productionOrderNumber.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.styleCode.toLowerCase().includes(q)
          : true,
      )
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  }, [orders, search, statusFilter]);

  const columns: MasterDataColumn<PackingOrder>[] = [
    { key: "num", header: "Packing Order", render: (o) => <span className="font-medium text-foreground">{o.packingOrderNumber}</span> },
    { key: "qc", header: "QC Order", render: (o) => o.qcOrderNumber },
    { key: "customer", header: "Customer", render: (o) => o.customerName },
    { key: "style", header: "Style", render: (o) => `${o.styleCode} · ${o.colorName}` },
    { key: "responsible", header: "Responsible", render: (o) => o.responsible ?? "—" },
    { key: "qty", header: "Qty", align: "right", render: (o) => `${o.quantity.toLocaleString()} pcs` },
    {
      key: "status",
      header: "Status",
      render: (o) => {
        const meta = packingOrderStatusMeta[o.status];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
  ];

  function renderCard(order: PackingOrder) {
    const meta = packingOrderStatusMeta[order.status];
    const summary = getPackingOrderQuantitySummary(order, entries.filter((e) => e.packingOrderId === order.id));
    return (
      <Card key={order.id} className="flex flex-col gap-2 p-4" role="button" tabIndex={0} onClick={() => router.push(`/packing/${order.id}`)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{order.packingOrderNumber}</span>
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
          <span>Packed {summary.packed.toLocaleString()} / {order.quantity.toLocaleString()} · {summary.cartons.toLocaleString()} cartons</span>
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
        title="Packing"
        description="Cartonize QC-approved garments and hand them off to Finished Goods"
        actions={<Button onClick={() => setCreateOpen(true)}>Create Packing Order</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Orders" value={metrics.active.length.toString()} icon={Package} accent="info" />
        <StatCard label="Packed" value={`${metrics.totalPacked.toLocaleString()} pcs`} icon={PackageCheck} accent="success" />
        <StatCard label="Cartons Packed" value={metrics.totalCartons.toLocaleString()} icon={Timer} />
        <StatCard label="On Hold" value={metrics.onHold.length.toString()} icon={AlertTriangle} accent={metrics.onHold.length > 0 ? "warning" : "success"} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "queue" | "all")}>
        <TabsList>
          <TabsTrigger value="queue">Work Queue</TabsTrigger>
          <TabsTrigger value="all">All Packing Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4 flex flex-col gap-3">
          {metrics.active.length === 0 ? (
            <EmptyState icon={PackageCheck} title="Nothing waiting on packing" description="Every packing order is either packed or cancelled." />
          ) : (
            metrics.active.map((order) => (
              <Card key={order.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className="text-sm font-semibold text-foreground hover:underline" onClick={() => router.push(`/packing/${order.id}`)}>
                      {order.packingOrderNumber}
                    </button>
                    <StatusBadge label={packingOrderStatusMeta[order.status].label} level={packingOrderStatusMeta[order.status].level} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {order.qcOrderNumber} · {order.customerName} · {order.styleCode} · {order.colorName}
                  </span>
                  <span className="text-xs text-muted-foreground">{order.quantity.toLocaleString()} pcs · {order.responsible ?? "Unassigned"}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StartPackingButton packingOrder={order} />
                  <Button variant="outline" onClick={() => router.push(`/packing/${order.id}`)}>
                    View
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 flex flex-col gap-4">
          <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search packing order, QC order, production order, customer or style…">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(packingOrderStatusMeta).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBar>

          {filteredAll.length === 0 ? (
            <EmptyState icon={Package} title="No packing orders match your filters" description="Try a different search term or status." />
          ) : (
            <>
              <MasterDataTable columns={columns} rows={filteredAll} onRowClick={(o) => router.push(`/packing/${o.id}`)} />
              <MasterDataCards rows={filteredAll} renderCard={(o) => renderCard(o)} />
            </>
          )}
        </TabsContent>
      </Tabs>

      <CreatePackingOrderDialog open={createOpen} onOpenChange={setCreateOpen} initialQcOrderId={searchParams.get("qcOrderId") ?? undefined} />
    </div>
  );
}
