"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ClipboardList, Package } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MasterDataTable, type MasterDataColumn } from "@/components/shared/master-data-table";
import { MasterDataCards } from "@/components/shared/master-data-cards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { orderPriorityMeta } from "@/lib/status";
import { computeMaterialRequirements, getMaterialAvailability, getRemainingQuantity, materialAvailabilityMeta } from "@/lib/production-utils";
import { orderHooks } from "@/features/orders/service";
import { productionOrderHooks, bomHooks } from "@/features/production/service";
import { inventoryHooks } from "@/features/inventory/service";
import { purchaseOrderHooks } from "@/features/purchasing/service";
import type { Order, OrderLineItem, OrderPriority } from "@/types";

interface PlannableRow {
  id: string;
  order: Order;
  lineItem: OrderLineItem;
  remaining: number;
}

type PriorityFilter = OrderPriority | "all";

const plannableOrderStatuses: Order["status"][] = ["confirmed", "in_production", "partially_completed"];

export function PlanningBoardView() {
  const router = useRouter();
  const { data: orders = [], isLoading: ordersLoading } = orderHooks.useList();
  const { data: productionOrders = [], isLoading: poLoading } = productionOrderHooks.useList();
  const { data: boms = [] } = bomHooks.useList();
  const { data: balances = [] } = inventoryHooks.useList();
  const { data: purchaseOrders = [] } = purchaseOrderHooks.useList();

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");

  const isLoading = ordersLoading || poLoading;

  const rows: PlannableRow[] = useMemo(() => {
    return orders
      .filter((order) => plannableOrderStatuses.includes(order.status))
      .flatMap((order) =>
        order.lineItems.map((lineItem) => ({
          id: lineItem.id,
          order,
          lineItem,
          remaining: getRemainingQuantity(lineItem, productionOrders),
        })),
      )
      .filter((row) => row.remaining > 0);
  }, [orders, productionOrders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((row) =>
        q
          ? row.order.orderNumber.toLowerCase().includes(q) ||
            row.order.customerName.toLowerCase().includes(q) ||
            row.lineItem.styleCode.toLowerCase().includes(q)
          : true,
      )
      .filter((row) => priorityFilter === "all" || row.order.priority === priorityFilter)
      .sort((a, b) => a.order.dueDate.localeCompare(b.order.dueDate));
  }, [rows, search, priorityFilter]);

  const stats = useMemo(() => {
    const distinctOrders = new Set(rows.map((r) => r.order.id)).size;
    const totalRemaining = rows.reduce((sum, r) => sum + r.remaining, 0);
    const urgentCount = rows.filter((r) => r.order.priority === "high" || r.order.priority === "urgent").length;
    return { distinctOrders, totalRemaining, urgentCount };
  }, [rows]);

  function materialStatusFor(row: PlannableRow) {
    const bom = boms.find((b) => b.styleId === row.lineItem.styleId);
    const lines = computeMaterialRequirements(row.remaining, bom, balances, purchaseOrders);
    return getMaterialAvailability(lines);
  }

  function planRow(row: PlannableRow) {
    router.push(`/production/plans/new?orderId=${row.order.id}&lineItemId=${row.lineItem.id}`);
  }

  const columns: MasterDataColumn<PlannableRow>[] = [
    { key: "customer", header: "Customer", render: (row) => row.order.customerName },
    { key: "order", header: "Order", render: (row) => row.order.orderNumber },
    { key: "style", header: "Style", render: (row) => `${row.lineItem.styleCode} · ${row.lineItem.colorName}` },
    { key: "remaining", header: "Remaining", align: "right", render: (row) => `${row.remaining.toLocaleString()} pcs` },
    { key: "delivery", header: "Delivery Date", align: "right", render: (row) => formatDate(row.order.dueDate) },
    {
      key: "priority",
      header: "Priority",
      render: (row) => {
        const meta = orderPriorityMeta[row.order.priority];
        return <StatusBadge label={meta.label} level={meta.level} hideIcon />;
      },
    },
    {
      key: "material",
      header: "Material",
      render: (row) => {
        const meta = materialAvailabilityMeta[materialStatusFor(row)];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
    {
      key: "action",
      header: "",
      align: "right",
      render: (row) => (
        <Button size="sm" onClick={() => planRow(row)}>
          Plan Production
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Production Planning" description="What needs to be manufactured next, and whether material is ready" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Orders Needing Planning" value={stats.distinctOrders.toString()} icon={ClipboardList} />
        <StatCard label="Pieces to Plan" value={stats.totalRemaining.toLocaleString()} icon={Package} />
        <StatCard
          label="High / Urgent Priority"
          value={stats.urgentCount.toString()}
          icon={AlertTriangle}
          accent={stats.urgentCount > 0 ? "warning" : "success"}
        />
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by order, customer or style…">
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      {isLoading ? (
        <Card className="flex flex-col gap-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nothing left to plan" description="Every open order item already has production planned against it." />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} onRowClick={(row) => router.push(`/orders/${row.order.id}`)} />
          <MasterDataCards
            rows={filtered}
            renderCard={(row) => {
              const priorityMeta = orderPriorityMeta[row.order.priority];
              const materialMeta = materialAvailabilityMeta[materialStatusFor(row)];
              return (
                <Card className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{row.order.orderNumber}</span>
                      <span className="text-xs text-muted-foreground">{row.order.customerName}</span>
                    </div>
                    <StatusBadge label={priorityMeta.label} level={priorityMeta.level} hideIcon />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">
                      {row.lineItem.styleCode} · {row.lineItem.colorName}
                    </span>
                    <span className="font-medium text-foreground">{row.remaining.toLocaleString()} pcs</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Due {formatDate(row.order.dueDate)}</span>
                    <StatusBadge label={materialMeta.label} level={materialMeta.level} />
                  </div>
                  <Button size="sm" className="mt-1 w-full" onClick={() => planRow(row)}>
                    Plan Production
                  </Button>
                </Card>
              );
            }}
          />
        </>
      )}
    </div>
  );
}
