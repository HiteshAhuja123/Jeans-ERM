"use client";

import { useMemo, useState } from "react";
import { Plus, Scale } from "lucide-react";
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
import { uomHooks } from "@/features/uom/service";
import { UomFormSheet } from "@/features/uom/uom-form-sheet";
import type { MasterStatus, UnitOfMeasure } from "@/types";

type StatusFilter = MasterStatus | "all";

export function UomView() {
  const { data: units = [], isLoading } = uomHooks.useList();
  const setStatusMutation = uomHooks.useSetStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitOfMeasure | undefined>();

  const filtered = useMemo(() => {
    return units
      .filter((unit) => statusFilter === "all" || unit.status === statusFilter)
      .filter((unit) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return unit.code.toLowerCase().includes(q) || unit.name.toLowerCase().includes(q);
      });
  }, [units, search, statusFilter]);

  function openCreate() {
    setEditingUnit(undefined);
    setSheetOpen(true);
  }

  function openEdit(unit: UnitOfMeasure) {
    setEditingUnit(unit);
    setSheetOpen(true);
  }

  async function handleToggleStatus(unit: UnitOfMeasure) {
    const next: MasterStatus = unit.status === "active" ? "inactive" : "active";
    await setStatusMutation.mutateAsync({ id: unit.id, status: next });
    toast.success(`${unit.name} marked ${next}`);
  }

  const columns: MasterDataColumn<UnitOfMeasure>[] = [
    { key: "code", header: "Code", render: (u) => <span className="font-medium text-foreground">{u.code}</span> },
    { key: "name", header: "Name", render: (u) => u.name },
    {
      key: "status",
      header: "Status",
      render: (u) => <StatusBadge label={activeStatusMeta[u.status].label} level={activeStatusMeta[u.status].level} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (u) => (
        <RowActionsMenu status={u.status} onEdit={() => openEdit(u)} onToggleStatus={() => handleToggleStatus(u)} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Units of Measurement"
        description="Configurable units used across materials, purchasing and inventory"
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add Unit
          </Button>
        }
      />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search units…">
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
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No units match your filters"
          description="Try a different search term or status, or add a new unit."
        />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} />
          <MasterDataCards
            rows={filtered}
            renderCard={(u) => (
              <Card className="flex items-center justify-between p-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{u.name}</span>
                  <span className="text-xs text-muted-foreground">Code: {u.code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={activeStatusMeta[u.status].label} level={activeStatusMeta[u.status].level} hideIcon />
                  <RowActionsMenu status={u.status} onEdit={() => openEdit(u)} onToggleStatus={() => handleToggleStatus(u)} />
                </div>
              </Card>
            )}
          />
        </>
      )}

      <UomFormSheet open={sheetOpen} onOpenChange={setSheetOpen} uom={editingUnit} existingUnits={units} />
    </div>
  );
}
