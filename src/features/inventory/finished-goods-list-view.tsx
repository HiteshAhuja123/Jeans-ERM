"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Boxes, PackageCheck, PackageX, Truck } from "lucide-react";

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
import { getFinishedGoodsAvailable, getFinishedGoodsOnHand, getFinishedGoodsStockLevel } from "@/lib/finished-goods-utils";
import { stockLevelMeta } from "@/lib/status";
import { finishedGoodsHooks } from "@/features/inventory/finished-goods-service";
import { warehouseHooks } from "@/features/warehouses/service";
import type { FinishedGoodsBalance } from "@/types";

export function FinishedGoodsListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: balances = [], isLoading } = finishedGoodsHooks.useList();
  const { data: warehouses = [] } = warehouseHooks.useList();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return balances
      .filter((b) =>
        q
          ? b.productionOrderNumber.toLowerCase().includes(q) ||
            b.orderNumber.toLowerCase().includes(q) ||
            b.customerName.toLowerCase().includes(q) ||
            b.styleCode.toLowerCase().includes(q)
          : true,
      )
      .filter((b) => warehouseFilter === "all" || b.warehouseId === warehouseFilter)
      .sort((a, b) => b.lastMovementDate.localeCompare(a.lastMovementDate));
  }, [balances, search, warehouseFilter]);

  const stats = useMemo(() => {
    const totalOnHand = balances.reduce((sum, b) => sum + getFinishedGoodsOnHand(b), 0);
    const totalAvailable = balances.reduce((sum, b) => sum + getFinishedGoodsAvailable(b), 0);
    const totalDispatched = balances.reduce((sum, b) => sum + b.dispatched, 0);
    return { total: balances.length, totalOnHand, totalAvailable, totalDispatched };
  }, [balances]);

  function warehouseName(warehouseId: string) {
    return warehouses.find((w) => w.id === warehouseId)?.name ?? "—";
  }

  const columns: MasterDataColumn<FinishedGoodsBalance>[] = [
    { key: "po", header: "Production Order", render: (b) => <span className="font-medium text-foreground">{b.productionOrderNumber}</span> },
    { key: "order", header: "Order / Customer", render: (b) => `${b.orderNumber} · ${b.customerName}` },
    { key: "style", header: "Style / Color", render: (b) => `${b.styleCode} · ${b.colorName}` },
    { key: "packed", header: "Packed", align: "right", render: (b) => <span className="tabular-nums">{b.packed.toLocaleString()}</span> },
    { key: "dispatched", header: "Dispatched", align: "right", render: (b) => <span className="tabular-nums text-muted-foreground">{b.dispatched.toLocaleString()}</span> },
    { key: "reserved", header: "Reserved", align: "right", render: (b) => <span className="tabular-nums text-muted-foreground">{b.reserved.toLocaleString()}</span> },
    {
      key: "available",
      header: "Available",
      align: "right",
      render: (b) => <span className="font-medium tabular-nums text-foreground">{getFinishedGoodsAvailable(b).toLocaleString()}</span>,
    },
    { key: "location", header: "Location", render: (b) => warehouseName(b.warehouseId) },
    {
      key: "status",
      header: "Status",
      render: (b) => {
        const meta = stockLevelMeta[getFinishedGoodsStockLevel(b)];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Finished Goods"
        description="Packed, dispatch-ready stock — traceable back to each production order"
        actions={
          <Button variant="outline" onClick={() => router.push("/inventory")}>
            View Raw Material Inventory
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Production Batches" value={stats.total.toString()} icon={Boxes} />
        <StatCard label="On Hand" value={stats.totalOnHand.toLocaleString()} icon={PackageCheck} accent="success" />
        <StatCard label="Available to Dispatch" value={stats.totalAvailable.toLocaleString()} icon={PackageCheck} accent={stats.totalAvailable > 0 ? "info" : "neutral"} />
        <StatCard label="Total Dispatched" value={stats.totalDispatched.toLocaleString()} icon={Truck} />
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search production order, customer order, customer or style…">
        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Warehouse" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All warehouses</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
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
        <EmptyState icon={PackageX} title="No finished goods match your filters" description="Once packing orders are packed, stock will appear here." />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} onRowClick={(b) => router.push(`/inventory/finished-goods/${b.productionOrderId}`)} />
          <MasterDataCards
            rows={filtered}
            renderCard={(b) => {
              const meta = stockLevelMeta[getFinishedGoodsStockLevel(b)];
              return (
                <Card className="flex flex-col gap-3 p-4" onClick={() => router.push(`/inventory/finished-goods/${b.productionOrderId}`)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{b.productionOrderNumber}</span>
                      <span className="text-xs text-muted-foreground">
                        {b.styleCode} · {b.colorName}
                      </span>
                    </div>
                    <StatusBadge label={meta.label} level={meta.level} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground tabular-nums">{getFinishedGoodsAvailable(b).toLocaleString()} available</span>
                    <span className="text-xs text-muted-foreground">{warehouseName(b.warehouseId)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {b.orderNumber} · {b.customerName}
                  </span>
                </Card>
              );
            }}
          />
        </>
      )}
    </div>
  );
}
