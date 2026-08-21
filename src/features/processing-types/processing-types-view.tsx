"use client";

import { useMemo, useState } from "react";
import { Droplets, Plus } from "lucide-react";
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
import { processingTypeHooks } from "@/features/processing-types/service";
import { ProcessingTypeFormSheet } from "@/features/processing-types/processing-type-form-sheet";
import type { MasterStatus, ProcessingType } from "@/types";

type StatusFilter = MasterStatus | "all";

export function ProcessingTypesView() {
  const { data: processingTypes = [], isLoading } = processingTypeHooks.useList();
  const setStatusMutation = processingTypeHooks.useSetStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<ProcessingType | undefined>();

  const filtered = useMemo(() => {
    return [...processingTypes]
      .filter((t) => statusFilter === "all" || t.status === statusFilter)
      .filter((t) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return t.code.toLowerCase().includes(q) || t.name.toLowerCase().includes(q);
      })
      .sort((a, b) => a.sequence - b.sequence);
  }, [processingTypes, search, statusFilter]);

  function openCreate() {
    setEditing(undefined);
    setSheetOpen(true);
  }

  function openEdit(processingType: ProcessingType) {
    setEditing(processingType);
    setSheetOpen(true);
  }

  async function handleToggleStatus(processingType: ProcessingType) {
    const next: MasterStatus = processingType.status === "active" ? "inactive" : "active";
    await setStatusMutation.mutateAsync({ id: processingType.id, status: next });
    toast.success(`${processingType.name} marked ${next}`);
  }

  const columns: MasterDataColumn<ProcessingType>[] = [
    { key: "sequence", header: "Seq", render: (t) => t.sequence },
    { key: "code", header: "Code", render: (t) => <span className="font-medium text-foreground">{t.code}</span> },
    { key: "name", header: "Name", render: (t) => t.name },
    {
      key: "status",
      header: "Status",
      render: (t) => <StatusBadge label={activeStatusMeta[t.status].label} level={activeStatusMeta[t.status].level} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (t) => <RowActionsMenu status={t.status} onEdit={() => openEdit(t)} onToggleStatus={() => handleToggleStatus(t)} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Processing Types"
        description="The washing/processing steps a batch can go through — Stone Wash, Enzyme Wash and so on."
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add Processing Type
          </Button>
        }
      />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search processing types…">
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
          icon={Droplets}
          title="No processing types match your filters"
          description="Try a different search term or status, or add a new processing type."
        />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} />
          <MasterDataCards
            rows={filtered}
            renderCard={(t) => (
              <Card className="flex items-center justify-between p-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {t.sequence}. {t.name}
                  </span>
                  <span className="text-xs text-muted-foreground">Code: {t.code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={activeStatusMeta[t.status].label} level={activeStatusMeta[t.status].level} hideIcon />
                  <RowActionsMenu status={t.status} onEdit={() => openEdit(t)} onToggleStatus={() => handleToggleStatus(t)} />
                </div>
              </Card>
            )}
          />
        </>
      )}

      <ProcessingTypeFormSheet open={sheetOpen} onOpenChange={setSheetOpen} processingType={editing} existingProcessingTypes={processingTypes} />
    </div>
  );
}
