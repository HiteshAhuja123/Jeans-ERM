"use client";

import { useMemo, useState } from "react";
import { PackageX } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { LabeledProgress } from "@/components/shared/labeled-progress";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { orderStatusMeta } from "@/lib/status";
import { mockOrders, orderStatusLabels } from "@/mock-data";
import type { Order, OrderStatus } from "@/types";

const statusFilters: Array<{ value: OrderStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "confirmed", label: orderStatusLabels.confirmed },
  { value: "in_production", label: orderStatusLabels.in_production },
  { value: "delayed", label: orderStatusLabels.delayed },
  { value: "completed", label: orderStatusLabels.completed },
  { value: "dispatched", label: orderStatusLabels.dispatched },
  { value: "draft", label: orderStatusLabels.draft },
];

function matchesSearch(order: Order, query: string) {
  if (!query) return true;
  const haystack = `${order.orderNumber} ${order.customerName} ${order.styleCode} ${order.styleName}`
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function OrdersView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const filteredOrders = useMemo(() => {
    return mockOrders.filter(
      (order) =>
        matchesSearch(order, search) && (statusFilter === "all" || order.status === statusFilter),
    );
  }, [search, statusFilter]);

  const delayedCount = mockOrders.filter((o) => o.isDelayed).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orders"
        description={`${mockOrders.length} orders total · ${delayedCount} delayed`}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by order #, customer or style…"
      >
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={PackageX}
          title="No orders match your filters"
          description="Try a different search term or clear the status filter."
        />
      ) : (
        <>
          {/* Desktop / tablet table */}
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Style &amp; Fabric</TableHead>
                  <TableHead className="w-56">Production</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const meta = orderStatusMeta[order.status];
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium text-foreground">{order.orderNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{order.customerName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-foreground">
                            {order.styleCode} · {order.styleName}
                          </span>
                          <span className="text-xs text-muted-foreground">{order.fabric}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <LabeledProgress
                          label={`${order.orderNumber} production progress`}
                          current={order.quantityProduced}
                          total={order.quantity}
                          level={order.isDelayed ? "critical" : "info"}
                          compact
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge label={meta.label} level={meta.level} />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(order.dueDate)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {filteredOrders.map((order) => {
              const meta = orderStatusMeta[order.status];
              return (
                <Card key={order.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{order.orderNumber}</span>
                      <span className="text-xs text-muted-foreground">{order.customerName}</span>
                    </div>
                    <StatusBadge label={meta.label} level={meta.level} />
                  </div>
                  <div className="mt-3 text-sm text-foreground">
                    {order.styleCode} · {order.styleName}
                  </div>
                  <div className="text-xs text-muted-foreground">{order.fabric}</div>
                  <LabeledProgress
                    label="Produced"
                    current={order.quantityProduced}
                    total={order.quantity}
                    level={order.isDelayed ? "critical" : "info"}
                    className="mt-3"
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Due {formatDate(order.dueDate)}</span>
                    <span className="capitalize">{order.priority} priority</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
