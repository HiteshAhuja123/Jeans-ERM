"use client";

import { useMemo, useState } from "react";
import { Plus, Ruler } from "lucide-react";
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
import { sizeHooks } from "@/features/sizes/service";
import { SizeFormSheet } from "@/features/sizes/size-form-sheet";
import type { MasterStatus, Size } from "@/types";

type StatusFilter = MasterStatus | "all";

export function SizesView() {
  const { data: sizes = [], isLoading } = sizeHooks.useList();
  const setStatusMutation = sizeHooks.useSetStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | undefined>();

  const filtered = useMemo(() => {
    return [...sizes]
      .filter((size) => statusFilter === "all" || size.status === statusFilter)
      .filter((size) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return size.code.toLowerCase().includes(q) || size.displayName.toLowerCase().includes(q);
      })
      .sort((a, b) => a.sequence - b.sequence);
  }, [sizes, search, statusFilter]);

  function openCreate() {
    setEditingSize(undefined);
    setSheetOpen(true);
  }

  function openEdit(size: Size) {
    setEditingSize(size);
    setSheetOpen(true);
  }

  async function handleToggleStatus(size: Size) {
    const next: MasterStatus = size.status === "active" ? "inactive" : "active";
    await setStatusMutation.mutateAsync({ id: size.id, status: next });
    toast.success(`${size.displayName} marked ${next}`);
  }

  const columns: MasterDataColumn<Size>[] = [
    { key: "code", header: "Code", render: (s) => <span className="font-medium text-foreground">{s.code}</span> },
    { key: "name", header: "Display Name", render: (s) => s.displayName },
    { key: "sequence", header: "Sequence", render: (s) => s.sequence },
    {
      key: "status",
      header: "Status",
      render: (s) => <StatusBadge label={activeStatusMeta[s.status].label} level={activeStatusMeta[s.status].level} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <RowActionsMenu status={s.status} onEdit={() => openEdit(s)} onToggleStatus={() => handleToggleStatus(s)} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sizes"
        description="Configurable size range used across styles and SKUs"
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add Size
          </Button>
        }
      />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search sizes…">
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
          icon={Ruler}
          title="No sizes match your filters"
          description="Try a different search term or status, or add a new size."
        />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} />
          <MasterDataCards
            rows={filtered}
            renderCard={(s) => (
              <Card className="flex items-center justify-between p-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{s.displayName}</span>
                  <span className="text-xs text-muted-foreground">
                    Code: {s.code} · Seq {s.sequence}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={activeStatusMeta[s.status].label} level={activeStatusMeta[s.status].level} hideIcon />
                  <RowActionsMenu status={s.status} onEdit={() => openEdit(s)} onToggleStatus={() => handleToggleStatus(s)} />
                </div>
              </Card>
            )}
          />
        </>
      )}

      <SizeFormSheet open={sheetOpen} onOpenChange={setSheetOpen} size={editingSize} existingSizes={sizes} />
    </div>
  );
}
