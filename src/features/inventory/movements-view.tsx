"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { History } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MasterDataTable, type MasterDataColumn } from "@/components/shared/master-data-table";
import { MasterDataCards } from "@/components/shared/master-data-cards";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { stockMovementTypeMeta } from "@/lib/status";
import { inventoryHooks } from "@/features/inventory/service";
import { warehouseHooks } from "@/features/warehouses/service";
import type { StockMovement, StockMovementType } from "@/types";

type TypeFilter = StockMovementType | "all";

const typeOptions: Array<{ value: TypeFilter; label: string }> = [
  { value: "all", label: "All types" },
  { value: "receipt", label: "Receipt" },
  { value: "issue", label: "Issue" },
  { value: "transfer", label: "Transfer" },
  { value: "adjustment", label: "Adjustment" },
  { value: "return", label: "Return" },
  { value: "damage", label: "Damage" },
  { value: "rejection", label: "Rejection" },
];

export function MovementsView() {
  const router = useRouter();
  const { data: movements = [], isLoading } = inventoryHooks.useMovements();
  const { data: warehouses = [] } = warehouseHooks.useList();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...movements]
      .filter((m) => (q ? m.materialName.toLowerCase().includes(q) || (m.reference ?? "").toLowerCase().includes(q) : true))
      .filter((m) => typeFilter === "all" || m.type === typeFilter)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [movements, search, typeFilter]);

  function warehouseName(id?: string) {
    return id ? (warehouses.find((w) => w.id === id)?.name ?? "—") : "—";
  }

  const columns: MasterDataColumn<StockMovement>[] = [
    { key: "date", header: "Date", render: (m) => formatDate(m.timestamp) },
    { key: "material", header: "Material", render: (m) => <span className="font-medium text-foreground">{m.materialName}</span> },
    {
      key: "type",
      header: "Type",
      render: (m) => {
        const meta = stockMovementTypeMeta[m.type];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
    {
      key: "quantity",
      header: "Quantity",
      align: "right",
      render: (m) => (
        <span className="tabular-nums">
          {m.quantity > 0 ? "+" : ""}
          {m.quantity.toLocaleString()} {m.unit}
        </span>
      ),
    },
    { key: "from", header: "From", render: (m) => warehouseName(m.fromWarehouseId) },
    { key: "to", header: "To", render: (m) => warehouseName(m.toWarehouseId) },
    { key: "reference", header: "Reference", render: (m) => m.reference ?? "—" },
    { key: "user", header: "User", render: (m) => m.performedBy },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Stock Movements" description="Every change to inventory, in one place" />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by material or reference…">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Movement type" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      {isLoading ? (
        <Card className="flex flex-col gap-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState icon={History} title="No movements match your filters" description="Try a different search term or movement type." />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} onRowClick={(m) => router.push(`/inventory/stock/${m.materialId}`)} />
          <MasterDataCards
            rows={filtered}
            renderCard={(m) => {
              const meta = stockMovementTypeMeta[m.type];
              return (
                <Card className="flex flex-col gap-1.5 p-4" onClick={() => router.push(`/inventory/stock/${m.materialId}`)}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{m.materialName}</span>
                    <StatusBadge label={meta.label} level={meta.level} hideIcon />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium tabular-nums text-foreground">
                      {m.quantity > 0 ? "+" : ""}
                      {m.quantity.toLocaleString()} {m.unit}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(m.timestamp)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {m.reference ? `${m.reference} · ` : ""}
                    {m.performedBy}
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
