"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Boxes, CheckCircle2, Package, PackageX, Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { LabeledProgress } from "@/components/shared/labeled-progress";
import { EmptyState } from "@/components/shared/empty-state";
import { MasterDataTable, type MasterDataColumn } from "@/components/shared/master-data-table";
import { MasterDataCards } from "@/components/shared/master-data-cards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { orderPriorityMeta, orderStatusMeta } from "@/lib/status";
import { customerHooks } from "@/features/customers/service";
import { orderHooks } from "@/features/orders/service";
import { OrderRowActionsMenu } from "@/features/orders/order-row-actions-menu";
import type { Order, OrderPriority, OrderStatus } from "@/types";

type StatusFilter = OrderStatus | "all";
type PriorityFilter = OrderPriority | "all";
type SortOption = "newest" | "oldest" | "delivery" | "quantity" | "priority";

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: orderStatusMeta.draft.label },
  { value: "confirmed", label: orderStatusMeta.confirmed.label },
  { value: "in_production", label: orderStatusMeta.in_production.label },
  { value: "partially_completed", label: orderStatusMeta.partially_completed.label },
  { value: "completed", label: orderStatusMeta.completed.label },
  { value: "dispatched", label: orderStatusMeta.dispatched.label },
  { value: "cancelled", label: orderStatusMeta.cancelled.label },
];

const priorityOptions: Array<{ value: PriorityFilter; label: string }> = [
  { value: "all", label: "All priorities" },
  { value: "urgent", label: orderPriorityMeta.urgent.label },
  { value: "high", label: orderPriorityMeta.high.label },
  { value: "normal", label: orderPriorityMeta.normal.label },
  { value: "low", label: orderPriorityMeta.low.label },
];

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "delivery", label: "Delivery date" },
  { value: "quantity", label: "Quantity" },
  { value: "priority", label: "Priority" },
];

const priorityRank: Record<OrderPriority, number> = { urgent: 3, high: 2, normal: 1, low: 0 };

function matchesSearch(order: Order, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  const haystack = [
    order.orderNumber,
    order.customerName,
    order.customerReference ?? "",
    ...order.lineItems.flatMap((li) => [li.styleCode, li.styleName]),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function isOrderStatus(value: string | null): value is OrderStatus {
  return !!value && value in orderStatusMeta;
}

export function OrdersView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: orders = [], isLoading } = orderHooks.useList();
  const { data: customers = [] } = customerHooks.useList();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    isOrderStatus(searchParams.get("status")) ? (searchParams.get("status") as OrderStatus) : "all",
  );
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [delayedOnly, setDelayedOnly] = useState(searchParams.get("delayed") === "1");
  const [sort, setSort] = useState<SortOption>("newest");

  const filtered = useMemo(() => {
    return orders
      .filter((order) => matchesSearch(order, search))
      .filter((order) => statusFilter === "all" || order.status === statusFilter)
      .filter((order) => priorityFilter === "all" || order.priority === priorityFilter)
      .filter((order) => customerFilter === "all" || order.customerId === customerFilter)
      .filter((order) => !delayedOnly || order.isDelayed)
      .sort((a, b) => {
        switch (sort) {
          case "oldest":
            return a.orderDate.localeCompare(b.orderDate);
          case "delivery":
            return a.dueDate.localeCompare(b.dueDate);
          case "quantity":
            return b.quantity - a.quantity;
          case "priority":
            return priorityRank[b.priority] - priorityRank[a.priority];
          case "newest":
          default:
            return b.orderDate.localeCompare(a.orderDate);
        }
      });
  }, [orders, search, statusFilter, priorityFilter, customerFilter, delayedOnly, sort]);

  const stats = useMemo(() => {
    const active = orders.filter((order) =>
      ["confirmed", "in_production", "partially_completed"].includes(order.status),
    ).length;
    const delayed = orders.filter((order) => order.isDelayed).length;
    const completed = orders.filter((order) => order.status === "completed" || order.status === "dispatched").length;
    return { total: orders.length, active, delayed, completed };
  }, [orders]);

  const columns: MasterDataColumn<Order>[] = [
    {
      key: "orderNumber",
      header: "Order No.",
      render: (order) => <span className="font-medium text-foreground">{order.orderNumber}</span>,
    },
    { key: "customer", header: "Customer", render: (order) => order.customerName },
    { key: "orderDate", header: "Order Date", render: (order) => formatDate(order.orderDate) },
    { key: "dueDate", header: "Delivery Date", render: (order) => formatDate(order.dueDate) },
    {
      key: "items",
      header: "Items",
      render: (order) => `${order.lineItems.length} style${order.lineItems.length === 1 ? "" : "s"}`,
    },
    {
      key: "quantity",
      header: "Total Qty",
      align: "right",
      render: (order) => order.quantity.toLocaleString(),
    },
    {
      key: "progress",
      header: "Production",
      className: "w-40",
      render: (order) => (
        <LabeledProgress
          label={`${order.orderNumber} production progress`}
          current={order.quantityProduced}
          total={order.quantity}
          level={order.isDelayed ? "critical" : "info"}
          compact
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (order) => {
        const meta = orderStatusMeta[order.status];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
    {
      key: "priority",
      header: "Priority",
      render: (order) => {
        const meta = orderPriorityMeta[order.priority];
        return <StatusBadge label={meta.label} level={meta.level} hideIcon />;
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (order) => <OrderRowActionsMenu order={order} onView={() => router.push(`/orders/${order.id}`)} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orders"
        description={`${stats.total} orders total · ${stats.active} active · ${stats.delayed} delayed`}
        actions={
          <Button onClick={() => router.push("/orders/new")}>
            <Plus /> New Order
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Orders" value={stats.total.toString()} icon={Package} />
        <StatCard label="Active" value={stats.active.toString()} icon={Boxes} accent="info" />
        <StatCard
          label="Delayed"
          value={stats.delayed.toString()}
          icon={AlertTriangle}
          accent={stats.delayed > 0 ? "critical" : "success"}
        />
        <StatCard label="Completed" value={stats.completed.toString()} icon={CheckCircle2} accent="success" />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search order #, customer, style, SKU…"
      >
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={customerFilter} onValueChange={setCustomerFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All customers</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {delayedOnly && (
          <Button type="button" variant="outline" size="sm" onClick={() => setDelayedOnly(false)}>
            Delayed only ✕
          </Button>
        )}
      </FilterBar>

      {isLoading ? (
        <Card className="flex flex-col gap-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={PackageX}
          title="No orders match your filters"
          description="Try a different search term, or clear a filter."
        />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} onRowClick={(order) => router.push(`/orders/${order.id}`)} />
          <MasterDataCards
            rows={filtered}
            renderCard={(order) => <OrderCard order={order} onView={() => router.push(`/orders/${order.id}`)} />}
          />
        </>
      )}
    </div>
  );
}

function OrderCard({ order, onView }: { order: Order; onView: () => void }) {
  const statusMeta = orderStatusMeta[order.status];
  const priorityMeta = orderPriorityMeta[order.priority];

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">{order.orderNumber}</span>
          <span className="text-xs text-muted-foreground">{order.customerName}</span>
        </div>
        <StatusBadge label={statusMeta.label} level={statusMeta.level} />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{order.quantity.toLocaleString()} pcs</span>
        <span className="text-xs text-muted-foreground">Delivery {formatDate(order.dueDate)}</span>
      </div>
      <LabeledProgress
        label="Production progress"
        current={order.quantityProduced}
        total={order.quantity}
        level={order.isDelayed ? "critical" : "info"}
      />
      <div className="flex items-center justify-between">
        <StatusBadge label={priorityMeta.label} level={priorityMeta.level} hideIcon />
        <Button variant="outline" size="sm" onClick={onView}>
          View Order
        </Button>
      </div>
    </Card>
  );
}
