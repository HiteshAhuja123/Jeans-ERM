"use client";

import { useMemo, useState } from "react";
import { Boxes, Plus } from "lucide-react";
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
import { productionLineHooks } from "@/features/production-lines/service";
import { ProductionLineFormSheet } from "@/features/production-lines/production-line-form-sheet";
import { mockDepartments } from "@/mock-data";
import type { MasterStatus, ProductionLine } from "@/types";

type StatusFilter = MasterStatus | "all";

function departmentName(departmentId: string) {
  return mockDepartments.find((d) => d.id === departmentId)?.name ?? "—";
}

export function ProductionLinesView() {
  const { data: lines = [], isLoading } = productionLineHooks.useList();
  const setStatusMutation = productionLineHooks.useSetStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<ProductionLine | undefined>();

  const filtered = useMemo(() => {
    return lines
      .filter((l) => statusFilter === "all" || l.status === statusFilter)
      .filter((l) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return l.code.toLowerCase().includes(q) || l.name.toLowerCase().includes(q);
      });
  }, [lines, search, statusFilter]);

  function openCreate() {
    setEditingLine(undefined);
    setSheetOpen(true);
  }

  function openEdit(line: ProductionLine) {
    setEditingLine(line);
    setSheetOpen(true);
  }

  async function handleToggleStatus(line: ProductionLine) {
    const next: MasterStatus = line.status === "active" ? "inactive" : "active";
    await setStatusMutation.mutateAsync({ id: line.id, status: next });
    toast.success(`${line.name} marked ${next}`);
  }

  const columns: MasterDataColumn<ProductionLine>[] = [
    { key: "code", header: "Code", render: (l) => <span className="font-medium text-foreground">{l.code}</span> },
    { key: "name", header: "Name", render: (l) => l.name },
    { key: "department", header: "Department", render: (l) => departmentName(l.departmentId) },
    { key: "capacity", header: "Capacity/day", align: "right", render: (l) => l.capacity.toLocaleString() },
    { key: "supervisor", header: "Supervisor", render: (l) => l.supervisor || "—" },
    {
      key: "status",
      header: "Status",
      render: (l) => <StatusBadge label={activeStatusMeta[l.status].label} level={activeStatusMeta[l.status].level} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (l) => (
        <RowActionsMenu status={l.status} onEdit={() => openEdit(l)} onToggleStatus={() => handleToggleStatus(l)} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Production Lines"
        description="Lines within each department, ready to host machines and production runs"
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add Production Line
          </Button>
        }
      />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search production lines…">
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
          icon={Boxes}
          title="No production lines match your filters"
          description="Try a different search term or status, or add a new line."
        />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} />
          <MasterDataCards
            rows={filtered}
            renderCard={(l) => (
              <Card className="flex items-center justify-between p-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{l.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {l.code} · {departmentName(l.departmentId)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={activeStatusMeta[l.status].label} level={activeStatusMeta[l.status].level} hideIcon />
                  <RowActionsMenu status={l.status} onEdit={() => openEdit(l)} onToggleStatus={() => handleToggleStatus(l)} />
                </div>
              </Card>
            )}
          />
        </>
      )}

      <ProductionLineFormSheet open={sheetOpen} onOpenChange={setSheetOpen} productionLine={editingLine} existingLines={lines} />
    </div>
  );
}
