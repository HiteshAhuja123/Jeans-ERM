"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, List as ListIcon, LayoutGrid, CalendarDays } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MasterDataTable, type MasterDataColumn } from "@/components/shared/master-data-table";
import { MasterDataCards } from "@/components/shared/master-data-cards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { orderPriorityMeta, sewingOrderStatusMeta } from "@/lib/status";
import { sewingOrderHooks } from "@/features/sewing/service";
import { productionLineHooks } from "@/features/production-lines/service";
import type { SewingOrder, SewingOrderStatus } from "@/types";

const activeStatuses: SewingOrderStatus[] = ["assigned", "ready", "in_progress", "on_hold", "partially_completed", "processing_complete"];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function SewingScheduleView() {
  const router = useRouter();
  const { data: sewingOrders = [], isLoading } = sewingOrderHooks.useList();
  const { data: lines = [] } = productionLineHooks.useList();

  const [view, setView] = useState<"list" | "calendar">("calendar");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const scheduled = useMemo(() => sewingOrders.filter((o) => activeStatuses.includes(o.status) && o.plannedStart && o.plannedEnd), [sewingOrders]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return date;
    });
  }, [weekStart]);

  function ordersForDate(dateIso: string) {
    return scheduled.filter((o) => dateIso >= (o.plannedStart as string) && dateIso <= (o.plannedEnd as string));
  }

  const listRows = useMemo(() => [...scheduled].sort((a, b) => (a.plannedStart as string).localeCompare(b.plannedStart as string)), [scheduled]);

  const columns: MasterDataColumn<SewingOrder>[] = [
    { key: "sew", header: "Sewing Order", render: (o) => <span className="font-medium text-foreground">{o.sewingOrderNumber}</span> },
    { key: "style", header: "Style", render: (o) => `${o.styleCode} · ${o.colorName}` },
    { key: "line", header: "Line", render: (o) => lines.find((l) => l.id === o.productionLineId)?.name ?? "Unassigned" },
    { key: "start", header: "Start", render: (o) => formatDate(o.plannedStart as string) },
    { key: "end", header: "End", render: (o) => formatDate(o.plannedEnd as string) },
    { key: "qty", header: "Qty", align: "right", render: (o) => o.quantity.toLocaleString() },
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
        const meta = sewingOrderStatusMeta[o.status];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sewing Schedule"
        description="Line assignments and planned dates for sewing orders"
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <Button variant={view === "calendar" ? "secondary" : "ghost"} size="sm" onClick={() => setView("calendar")}>
              <LayoutGrid /> Calendar
            </Button>
            <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setView("list")}>
              <ListIcon /> List
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <Card className="flex flex-col gap-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      ) : view === "list" ? (
        scheduled.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Nothing scheduled" description="Assign a sewing order to a line to see it here." />
        ) : (
          <>
            <MasterDataTable columns={columns} rows={listRows} onRowClick={(o) => router.push(`/sewing/orders/${o.id}`)} />
            <MasterDataCards
              rows={listRows}
              renderCard={(o) => {
                const meta = sewingOrderStatusMeta[o.status];
                return (
                  <Card className="flex flex-col gap-1.5 p-4" onClick={() => router.push(`/sewing/orders/${o.id}`)}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{o.sewingOrderNumber}</span>
                      <StatusBadge label={meta.label} level={meta.level} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {o.styleCode} · {o.colorName} · {o.quantity.toLocaleString()} pcs
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(o.plannedStart as string)} – {formatDate(o.plannedEnd as string)} · {lines.find((l) => l.id === o.productionLineId)?.name ?? "Unassigned"}
                    </span>
                  </Card>
                );
              }}
            />
          </>
        )
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon-sm" aria-label="Previous week" onClick={() => setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium text-foreground">
              {formatDate(toIso(weekDays[0]))} – {formatDate(toIso(weekDays[6]))}
            </span>
            <Button variant="outline" size="icon-sm" aria-label="Next week" onClick={() => setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}>
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="flex snap-x gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-7 sm:overflow-visible">
            {weekDays.map((date) => {
              const dateIso = toIso(date);
              const isToday = dateIso === toIso(new Date());
              const dayOrders = ordersForDate(dateIso);
              return (
                <Card
                  key={dateIso}
                  className={cn("flex w-64 shrink-0 snap-start flex-col gap-2 p-3 sm:w-auto", isToday && "border-primary/50 bg-primary/5")}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      {date.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    {dayOrders.length > 0 && <span className="text-[11px] text-muted-foreground">{dayOrders.length}</span>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {dayOrders.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      dayOrders.map((o) => {
                        const meta = sewingOrderStatusMeta[o.status];
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => router.push(`/sewing/orders/${o.id}`)}
                            className="flex flex-col rounded-md border border-border bg-card px-2 py-1.5 text-left hover:border-primary/40"
                          >
                            <span className="truncate text-xs font-medium text-foreground">{o.sewingOrderNumber}</span>
                            <span className="truncate text-[11px] text-muted-foreground">
                              {lines.find((l) => l.id === o.productionLineId)?.name ?? "Unassigned"} · {o.quantity.toLocaleString()} pcs
                            </span>
                            <StatusBadge label={meta.label} level={meta.level} hideIcon className="mt-1 w-fit" />
                          </button>
                        );
                      })
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
