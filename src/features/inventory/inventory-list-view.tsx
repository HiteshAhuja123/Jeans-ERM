"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Boxes, IndianRupee, PackageX } from "lucide-react";

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
import { formatCurrency } from "@/lib/format";
import { getAvailableStock, getInventoryValue, getOnOrderQuantity, getStockStatus } from "@/lib/inventory-utils";
import { stockLevelMeta } from "@/lib/status";
import { inventoryHooks } from "@/features/inventory/service";
import { purchaseOrderHooks } from "@/features/purchasing/service";
import { warehouseHooks } from "@/features/warehouses/service";
import { mockMaterialGroups, mockUnitsOfMeasure } from "@/mock-data";
import type { InventoryBalance, Material, MaterialCategory, StockLevel } from "@/types";
import { materialHooks } from "@/features/materials/service";

const categoryLabels: Record<MaterialCategory, string> = {
  fabric: "Fabric",
  accessory: "Accessory",
  raw_material: "Raw Material",
  finished_good: "Finished Good",
};

function categoryOf(material: Material): MaterialCategory {
  return mockMaterialGroups.find((g) => g.id === material.materialGroupId)?.parentCategory ?? "raw_material";
}

function unitCode(uomId: string) {
  return mockUnitsOfMeasure.find((u) => u.id === uomId)?.code ?? "—";
}

interface InventoryRow {
  id: string;
  material: Material;
  balance: InventoryBalance;
  category: MaterialCategory;
  unit: string;
  available: number;
  onOrder: number;
  status: StockLevel;
}

type StockFilter = StockLevel | "all";
type CategoryFilter = MaterialCategory | "all";

function zeroBalance(materialId: string): InventoryBalance {
  return {
    id: materialId,
    materialId,
    onHand: 0,
    reserved: 0,
    rejected: 0,
    reorderPoint: 0,
    minimumStock: 0,
    unitCost: 0,
    locations: [],
    lastMovementDate: "",
  };
}

export function InventoryListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: materials = [], isLoading: materialsLoading } = materialHooks.useList();
  const { data: balances = [], isLoading: balancesLoading } = inventoryHooks.useList();
  const { data: purchaseOrders = [] } = purchaseOrderHooks.useList();
  const { data: warehouses = [] } = warehouseHooks.useList();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>(
    searchParams.get("stock") === "attention" ? "low" : "all",
  );

  const isLoading = materialsLoading || balancesLoading;

  const rows: InventoryRow[] = useMemo(() => {
    return materials
      .filter((material) => material.status === "active")
      .map((material) => {
        const balance = balances.find((b) => b.materialId === material.id) ?? zeroBalance(material.id);
        return {
          id: material.id,
          material,
          balance,
          category: categoryOf(material),
          unit: unitCode(material.uomId),
          available: getAvailableStock(balance),
          onOrder: getOnOrderQuantity(material.id, purchaseOrders),
          status: getStockStatus(balance),
        };
      });
  }, [materials, balances, purchaseOrders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((row) => (q ? row.material.code.toLowerCase().includes(q) || row.material.name.toLowerCase().includes(q) : true))
      .filter((row) => categoryFilter === "all" || row.category === categoryFilter)
      .filter((row) =>
        warehouseFilter === "all" ? true : row.balance.locations.some((loc) => loc.warehouseId === warehouseFilter),
      )
      .filter((row) => {
        if (stockFilter === "all") return true;
        if (stockFilter === "low") return row.status === "low" || row.status === "critical" || row.status === "out_of_stock";
        return row.status === stockFilter;
      });
  }, [rows, search, categoryFilter, warehouseFilter, stockFilter]);

  const stats = useMemo(() => {
    const low = rows.filter((r) => r.status === "low" || r.status === "critical").length;
    const outOfStock = rows.filter((r) => r.status === "out_of_stock").length;
    const value = rows.reduce((sum, r) => sum + getInventoryValue(r.balance), 0);
    return { total: rows.length, low, outOfStock, value };
  }, [rows]);

  function locationSummary(row: InventoryRow) {
    if (row.balance.locations.length === 0) return "Not stocked";
    if (row.balance.locations.length === 1) {
      const loc = row.balance.locations[0];
      const wh = warehouses.find((w) => w.id === loc.warehouseId);
      return wh?.name ?? "—";
    }
    return `${row.balance.locations.length} locations`;
  }

  const columns: MasterDataColumn<InventoryRow>[] = [
    { key: "code", header: "Code", render: (row) => <span className="font-medium text-foreground">{row.material.code}</span> },
    { key: "name", header: "Material", render: (row) => row.material.name },
    { key: "category", header: "Category", render: (row) => categoryLabels[row.category] },
    { key: "location", header: "Warehouse", render: (row) => locationSummary(row) },
    {
      key: "available",
      header: "Available",
      align: "right",
      render: (row) => (
        <span className="tabular-nums">
          {row.available.toLocaleString()} {row.unit}
        </span>
      ),
    },
    {
      key: "reserved",
      header: "Reserved",
      align: "right",
      render: (row) => (
        <span className="tabular-nums text-muted-foreground">
          {row.balance.reserved.toLocaleString()} {row.unit}
        </span>
      ),
    },
    {
      key: "onOrder",
      header: "On Order",
      align: "right",
      render: (row) => (
        <span className="tabular-nums text-muted-foreground">
          {row.onOrder > 0 ? `${row.onOrder.toLocaleString()} ${row.unit}` : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Stock Status",
      render: (row) => {
        const meta = stockLevelMeta[row.status];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inventory"
        description={`${stats.total} materials tracked · ${stats.low} low stock · ${stats.outOfStock} out of stock`}
        actions={
          <Button variant="outline" onClick={() => router.push("/inventory/movements")}>
            View Movements
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Materials" value={stats.total.toString()} icon={Boxes} />
        <StatCard
          label="Low / Critical Stock"
          value={stats.low.toString()}
          icon={AlertTriangle}
          accent={stats.low > 0 ? "warning" : "success"}
          href="/inventory/low-stock"
        />
        <StatCard
          label="Out of Stock"
          value={stats.outOfStock.toString()}
          icon={PackageX}
          accent={stats.outOfStock > 0 ? "critical" : "success"}
        />
        <StatCard label="Estimated Stock Value" value={formatCurrency(stats.value)} icon={IndianRupee} helpText="Operational estimate" />
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by material code or name…">
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockFilter)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stock levels</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
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
        <EmptyState icon={PackageX} title="No materials match your filters" description="Try a different search term, or clear a filter." />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} onRowClick={(row) => router.push(`/inventory/stock/${row.material.id}`)} />
          <MasterDataCards
            rows={filtered}
            renderCard={(row) => {
              const meta = stockLevelMeta[row.status];
              return (
                <Card className="flex flex-col gap-3 p-4" onClick={() => router.push(`/inventory/stock/${row.material.id}`)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{row.material.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {row.material.code} · {categoryLabels[row.category]}
                      </span>
                    </div>
                    <StatusBadge label={meta.label} level={meta.level} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground tabular-nums">
                      {row.available.toLocaleString()} {row.unit} available
                    </span>
                    <span className="text-xs text-muted-foreground">{locationSummary(row)}</span>
                  </div>
                  {row.onOrder > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {row.onOrder.toLocaleString()} {row.unit} on order
                    </span>
                  )}
                </Card>
              );
            }}
          />
        </>
      )}
    </div>
  );
}
