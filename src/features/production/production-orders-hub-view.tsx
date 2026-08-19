"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Package, Plus } from "lucide-react";

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
import { orderPriorityMeta, productionOrderStatusMeta, productionPlanStatusMeta } from "@/lib/status";
import { productionOrderHooks, productionPlanHooks } from "@/features/production/service";
import { productionLineHooks } from "@/features/production-lines/service";
import type { ProductionOrder, ProductionOrderStatus, ProductionPlan, ProductionPlanStatus } from "@/types";

type PoStatusFilter = ProductionOrderStatus | "all";
type PlanStatusFilter = ProductionPlanStatus | "all";

export function ProductionOrdersHubView() {
  const router = useRouter();
  const { data: productionOrders = [], isLoading: poLoading } = productionOrderHooks.useList();
  const { data: plans = [], isLoading: plansLoading } = productionPlanHooks.useList();
  const { data: lines = [] } = productionLineHooks.useList();

  const [tab, setTab] = useState<"orders" | "plans">("orders");
  const [poSearch, setPoSearch] = useState("");
  const [poStatusFilter, setPoStatusFilter] = useState<PoStatusFilter>("all");
  const [lineFilter, setLineFilter] = useState<string>("all");
  const [planSearch, setPlanSearch] = useState("");
  const [planStatusFilter, setPlanStatusFilter] = useState<PlanStatusFilter>("all");

  const filteredOrders = useMemo(() => {
    const q = poSearch.trim().toLowerCase();
    return productionOrders
      .filter((po) =>
        q
          ? po.productionOrderNumber.toLowerCase().includes(q) ||
            po.orderNumber.toLowerCase().includes(q) ||
            po.customerName.toLowerCase().includes(q) ||
            po.styleCode.toLowerCase().includes(q)
          : true,
      )
      .filter((po) => poStatusFilter === "all" || po.status === poStatusFilter)
      .filter((po) => lineFilter === "all" || po.productionLineId === lineFilter)
      .sort((a, b) => b.plannedStart.localeCompare(a.plannedStart));
  }, [productionOrders, poSearch, poStatusFilter, lineFilter]);

  const filteredPlans = useMemo(() => {
    const q = planSearch.trim().toLowerCase();
    return plans
      .filter((plan) => (q ? plan.planNumber.toLowerCase().includes(q) || plan.planner.toLowerCase().includes(q) : true))
      .filter((plan) => planStatusFilter === "all" || plan.status === planStatusFilter)
      .sort((a, b) => b.periodStart.localeCompare(a.periodStart));
  }, [plans, planSearch, planStatusFilter]);

  function planStats(plan: ProductionPlan) {
    const orders = productionOrders.filter((po) => po.planId === plan.id);
    return { orderCount: orders.length, totalQty: orders.reduce((sum, po) => sum + po.quantity, 0) };
  }

  const poColumns: MasterDataColumn<ProductionOrder>[] = [
    { key: "prodNumber", header: "Production Order", render: (po) => <span className="font-medium text-foreground">{po.productionOrderNumber}</span> },
    { key: "customer", header: "Customer", render: (po) => po.customerName },
    { key: "style", header: "Style", render: (po) => `${po.styleCode} · ${po.colorName}` },
    { key: "qty", header: "Qty", align: "right", render: (po) => po.quantity.toLocaleString() },
    { key: "line", header: "Line", render: (po) => lines.find((l) => l.id === po.productionLineId)?.name ?? "Unassigned" },
    {
      key: "priority",
      header: "Priority",
      render: (po) => {
        const meta = orderPriorityMeta[po.priority];
        return <StatusBadge label={meta.label} level={meta.level} hideIcon />;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (po) => {
        const meta = productionOrderStatusMeta[po.status];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
    { key: "planned", header: "Planned End", align: "right", render: (po) => formatDate(po.plannedEnd) },
  ];

  const planColumns: MasterDataColumn<ProductionPlan>[] = [
    { key: "planNumber", header: "Plan", render: (plan) => <span className="font-medium text-foreground">{plan.planNumber}</span> },
    { key: "period", header: "Period", render: (plan) => `${formatDate(plan.periodStart)} – ${formatDate(plan.periodEnd)}` },
    { key: "planner", header: "Planner", render: (plan) => plan.planner },
    { key: "orders", header: "Orders", align: "right", render: (plan) => planStats(plan).orderCount.toString() },
    { key: "qty", header: "Total Qty", align: "right", render: (plan) => planStats(plan).totalQty.toLocaleString() },
    {
      key: "status",
      header: "Status",
      render: (plan) => {
        const meta = productionPlanStatusMeta[plan.status];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Production Orders"
        description="What the factory has decided to manufacture, grouped into production plans"
        actions={
          <Button onClick={() => router.push("/production/plans/new")}>
            <Plus /> New Plan
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "orders" | "plans")}>
        <TabsList>
          <TabsTrigger value="orders">Production Orders</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4 flex flex-col gap-4">
          <FilterBar searchValue={poSearch} onSearchChange={setPoSearch} searchPlaceholder="Search production order, customer order, customer or style…">
            <Select value={poStatusFilter} onValueChange={(v) => setPoStatusFilter(v as PoStatusFilter)}>
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
            <Select value={lineFilter} onValueChange={setLineFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Line" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All lines</SelectItem>
                {lines.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBar>

          {poLoading ? (
            <Card className="flex flex-col gap-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </Card>
          ) : filteredOrders.length === 0 ? (
            <EmptyState icon={Package} title="No production orders match your filters" description="Try a different search term or status." />
          ) : (
            <>
              <MasterDataTable columns={poColumns} rows={filteredOrders} onRowClick={(po) => router.push(`/production/orders/${po.id}`)} />
              <MasterDataCards
                rows={filteredOrders}
                renderCard={(po) => {
                  const meta = productionOrderStatusMeta[po.status];
                  const priorityMeta = orderPriorityMeta[po.priority];
                  return (
                    <Card className="flex flex-col gap-2 p-4" onClick={() => router.push(`/production/orders/${po.id}`)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{po.productionOrderNumber}</span>
                          <span className="text-xs text-muted-foreground">{po.customerName}</span>
                        </div>
                        <StatusBadge label={meta.label} level={meta.level} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">
                          {po.styleCode} · {po.colorName}
                        </span>
                        <span className="font-medium text-foreground">{po.quantity.toLocaleString()} pcs</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{lines.find((l) => l.id === po.productionLineId)?.name ?? "Unassigned"}</span>
                        <StatusBadge label={priorityMeta.label} level={priorityMeta.level} hideIcon />
                      </div>
                    </Card>
                  );
                }}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="plans" className="mt-4 flex flex-col gap-4">
          <FilterBar searchValue={planSearch} onSearchChange={setPlanSearch} searchPlaceholder="Search by plan number or planner…">
            <Select value={planStatusFilter} onValueChange={(v) => setPlanStatusFilter(v as PlanStatusFilter)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(productionPlanStatusMeta).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBar>

          {plansLoading ? (
            <Card className="flex flex-col gap-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </Card>
          ) : filteredPlans.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No production plans match your filters" description="Create a plan from the Planning Board." />
          ) : (
            <>
              <MasterDataTable columns={planColumns} rows={filteredPlans} onRowClick={(plan) => router.push(`/production/plans/${plan.id}`)} />
              <MasterDataCards
                rows={filteredPlans}
                renderCard={(plan) => {
                  const meta = productionPlanStatusMeta[plan.status];
                  const stats = planStats(plan);
                  return (
                    <Card className="flex flex-col gap-2 p-4" onClick={() => router.push(`/production/plans/${plan.id}`)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{plan.planNumber}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(plan.periodStart)} – {formatDate(plan.periodEnd)}
                          </span>
                        </div>
                        <StatusBadge label={meta.label} level={meta.level} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{stats.orderCount} orders</span>
                        <span className="font-medium text-foreground">{stats.totalQty.toLocaleString()} pcs</span>
                      </div>
                    </Card>
                  );
                }}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
