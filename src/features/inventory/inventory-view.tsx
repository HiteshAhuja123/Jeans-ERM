"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, PackageSearch, RefreshCw, Repeat } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { stockLevelMeta } from "@/lib/status";
import { mockInventoryItems, mockStockMovements } from "@/mock-data";
import type { InventoryItem, MaterialCategory } from "@/types";

const categoryLabels: Record<MaterialCategory, string> = {
  fabric: "Fabric",
  accessory: "Accessory",
  raw_material: "Raw Material",
  finished_good: "Finished Good",
};

const categoryFilters: Array<{ value: MaterialCategory | "all"; label: string }> = [
  { value: "all", label: "All categories" },
  { value: "fabric", label: "Fabric" },
  { value: "accessory", label: "Accessories" },
  { value: "raw_material", label: "Raw Materials" },
  { value: "finished_good", label: "Finished Goods" },
];

const movementIcons = {
  receipt: ArrowDownToLine,
  issue: ArrowUpFromLine,
  adjustment: RefreshCw,
  transfer: Repeat,
};

function matchesSearch(item: InventoryItem, query: string) {
  if (!query) return true;
  return `${item.sku} ${item.name}`.toLowerCase().includes(query.toLowerCase());
}

export function InventoryView() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MaterialCategory | "all">("all");

  const filteredItems = useMemo(() => {
    return mockInventoryItems.filter(
      (item) => matchesSearch(item, search) && (category === "all" || item.category === category),
    );
  }, [search, category]);

  const lowStockCount = mockInventoryItems.filter(
    (i) => i.stockLevel === "low" || i.stockLevel === "critical",
  ).length;
  const outOfStockCount = mockInventoryItems.filter((i) => i.stockLevel === "out_of_stock").length;
  const totalValue = mockInventoryItems.reduce((sum, i) => sum + i.quantityInStock * i.unitCost, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inventory"
        description="Fabric, accessories, raw materials and finished goods on hand"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total SKUs" value={mockInventoryItems.length.toString()} icon={PackageSearch} />
        <StatCard
          label="Low / Critical Stock"
          value={lowStockCount.toString()}
          icon={ArrowDownToLine}
          accent={lowStockCount > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Out of Stock"
          value={outOfStockCount.toString()}
          icon={PackageSearch}
          accent={outOfStockCount > 0 ? "critical" : "success"}
        />
        <StatCard label="Inventory Value" value={formatCurrency(totalValue)} icon={ArrowUpFromLine} />
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by SKU or name…">
        <Select value={category} onValueChange={(v) => setCategory(v as MaterialCategory | "all")}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categoryFilters.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No items match your filters"
          description="Try a different search term or category."
        />
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">In Stock</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Last Movement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const meta = stockLevelMeta[item.stockLevel];
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-foreground">{item.sku}</TableCell>
                      <TableCell className="text-foreground">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {categoryLabels[item.category]}
                      </TableCell>
                      <TableCell className="text-right text-foreground tabular-nums">
                        {item.quantityInStock.toLocaleString()} {item.unit}
                      </TableCell>
                      <TableCell>
                        <StatusBadge label={meta.label} level={meta.level} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.warehouseLocation}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(item.lastMovementDate)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          <div className="flex flex-col gap-3 md:hidden">
            {filteredItems.map((item) => {
              const meta = stockLevelMeta[item.stockLevel];
              return (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.sku}</span>
                    </div>
                    <StatusBadge label={meta.label} level={meta.level} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{categoryLabels[item.category]}</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {item.quantityInStock.toLocaleString()} {item.unit}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.warehouseLocation}</span>
                    <span>Moved {formatDate(item.lastMovementDate)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Stock Movements</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {mockStockMovements.map((movement) => {
            const Icon = movementIcons[movement.type];
            const isNegative = movement.type === "issue" || movement.quantity < 0;
            return (
              <div key={movement.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {movement.itemName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {movement.reference} · {movement.performedBy}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span
                    className={`text-sm font-medium tabular-nums ${isNegative ? "text-critical" : "text-success"}`}
                  >
                    {isNegative ? "-" : "+"}
                    {Math.abs(movement.quantity).toLocaleString()} {movement.unit}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(movement.date)}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
