"use client";

import { useMemo, useState } from "react";
import { Palette, Plus } from "lucide-react";
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
import { colorHooks } from "@/features/colors/service";
import { ColorFormSheet } from "@/features/colors/color-form-sheet";
import type { Color, MasterStatus } from "@/types";

type StatusFilter = MasterStatus | "all";

export function ColorsView() {
  const { data: colors = [], isLoading } = colorHooks.useList();
  const setStatusMutation = colorHooks.useSetStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | undefined>();

  const filtered = useMemo(() => {
    return colors
      .filter((color) => statusFilter === "all" || color.status === statusFilter)
      .filter((color) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return color.code.toLowerCase().includes(q) || color.name.toLowerCase().includes(q);
      });
  }, [colors, search, statusFilter]);

  function openCreate() {
    setEditingColor(undefined);
    setSheetOpen(true);
  }

  function openEdit(color: Color) {
    setEditingColor(color);
    setSheetOpen(true);
  }

  async function handleToggleStatus(color: Color) {
    const next: MasterStatus = color.status === "active" ? "inactive" : "active";
    await setStatusMutation.mutateAsync({ id: color.id, status: next });
    toast.success(`${color.name} marked ${next}`);
  }

  const columns: MasterDataColumn<Color>[] = [
    {
      key: "swatch",
      header: "",
      render: (c) => <span className="inline-block size-4 rounded-full border border-border" style={{ backgroundColor: c.hex }} />,
    },
    { key: "code", header: "Code", render: (c) => <span className="font-medium text-foreground">{c.code}</span> },
    { key: "name", header: "Name", render: (c) => c.name },
    {
      key: "status",
      header: "Status",
      render: (c) => <StatusBadge label={activeStatusMeta[c.status].label} level={activeStatusMeta[c.status].level} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => (
        <RowActionsMenu status={c.status} onEdit={() => openEdit(c)} onToggleStatus={() => handleToggleStatus(c)} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Colors"
        description="Configurable color palette used across styles and SKUs"
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add Color
          </Button>
        }
      />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search colors…">
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
          icon={Palette}
          title="No colors match your filters"
          description="Try a different search term or status, or add a new color."
        />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} />
          <MasterDataCards
            rows={filtered}
            renderCard={(c) => (
              <Card className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="inline-block size-6 shrink-0 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{c.name}</span>
                    <span className="text-xs text-muted-foreground">Code: {c.code}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={activeStatusMeta[c.status].label} level={activeStatusMeta[c.status].level} hideIcon />
                  <RowActionsMenu status={c.status} onEdit={() => openEdit(c)} onToggleStatus={() => handleToggleStatus(c)} />
                </div>
              </Card>
            )}
          />
        </>
      )}

      <ColorFormSheet open={sheetOpen} onOpenChange={setSheetOpen} color={editingColor} existingColors={colors} />
    </div>
  );
}
