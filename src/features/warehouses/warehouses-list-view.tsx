"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Warehouse as WarehouseIcon } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import { MasterDataTable, type MasterDataColumn } from "@/components/shared/master-data-table";
import { MasterDataCards } from "@/components/shared/master-data-cards";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { activeStatusMeta } from "@/lib/status";
import { warehouseHooks } from "@/features/warehouses/service";
import { WarehouseFormSheet } from "@/features/warehouses/warehouse-form-sheet";
import type { MasterStatus, Warehouse } from "@/types";

type StatusFilter = MasterStatus | "all";

const typeLabels: Record<Warehouse["type"], string> = {
  raw_material: "Raw Material",
  finished_goods: "Finished Goods",
  general: "General",
};

export function WarehousesListView() {
  const router = useRouter();
  const { data: warehouses = [], isLoading } = warehouseHooks.useList();
  const setStatusMutation = warehouseHooks.useSetStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | undefined>();

  const filtered = useMemo(() => {
    return warehouses
      .filter((w) => statusFilter === "all" || w.status === statusFilter)
      .filter((w) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return w.code.toLowerCase().includes(q) || w.name.toLowerCase().includes(q);
      });
  }, [warehouses, search, statusFilter]);

  function openCreate() {
    setEditingWarehouse(undefined);
    setSheetOpen(true);
  }

  function openEdit(warehouse: Warehouse) {
    setEditingWarehouse(warehouse);
    setSheetOpen(true);
  }

  async function handleToggleStatus(warehouse: Warehouse) {
    const next: MasterStatus = warehouse.status === "active" ? "inactive" : "active";
    await setStatusMutation.mutateAsync({ id: warehouse.id, status: next });
    toast.success(`${warehouse.name} marked ${next}`);
  }

  const columns: MasterDataColumn<Warehouse>[] = [
    { key: "code", header: "Code", render: (w) => <span className="font-medium text-foreground">{w.code}</span> },
    { key: "name", header: "Name", render: (w) => w.name },
    { key: "type", header: "Type", render: (w) => typeLabels[w.type] },
    {
      key: "status",
      header: "Status",
      render: (w) => <StatusBadge label={activeStatusMeta[w.status].label} level={activeStatusMeta[w.status].level} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (w) => (
        <RowActionsMenu
          status={w.status}
          onView={() => router.push(`/masters/warehouses/${w.id}`)}
          onEdit={() => openEdit(w)}
          onToggleStatus={() => handleToggleStatus(w)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Warehouses"
        description="Warehouses and the storage locations inside them"
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add Warehouse
          </Button>
        }
      />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search warehouses…">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      {isLoading ? (
        <Card className="flex flex-col gap-3 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={WarehouseIcon}
          title="No warehouses match your filters"
          description="Try a different search term or status, or add a new warehouse."
        />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} onRowClick={(w) => router.push(`/masters/warehouses/${w.id}`)} />
          <MasterDataCards
            rows={filtered}
            renderCard={(w) => (
              <Card className="flex items-center justify-between p-4" onClick={() => router.push(`/masters/warehouses/${w.id}`)}>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{w.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {w.code} · {typeLabels[w.type]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={activeStatusMeta[w.status].label} level={activeStatusMeta[w.status].level} hideIcon />
                  <RowActionsMenu status={w.status} onEdit={() => openEdit(w)} onToggleStatus={() => handleToggleStatus(w)} />
                </div>
              </Card>
            )}
          />
        </>
      )}

      <WarehouseFormSheet open={sheetOpen} onOpenChange={setSheetOpen} warehouse={editingWarehouse} existingWarehouses={warehouses} />
    </div>
  );
}
