"use client";

import { useMemo, useState } from "react";
import { ListOrdered, Plus } from "lucide-react";
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
import { processHooks } from "@/features/processes/service";
import { ProcessFormSheet } from "@/features/processes/process-form-sheet";
import { mockDepartments } from "@/mock-data";
import type { MasterStatus, Process } from "@/types";

type StatusFilter = MasterStatus | "all";

function departmentName(departmentId?: string) {
  return mockDepartments.find((d) => d.id === departmentId)?.name ?? "—";
}

export function ProcessesView() {
  const { data: processes = [], isLoading } = processHooks.useList();
  const setStatusMutation = processHooks.useSetStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | undefined>();

  const filtered = useMemo(() => {
    return [...processes]
      .filter((p) => statusFilter === "all" || p.status === statusFilter)
      .filter((p) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
      })
      .sort((a, b) => a.sequence - b.sequence);
  }, [processes, search, statusFilter]);

  function openCreate() {
    setEditingProcess(undefined);
    setSheetOpen(true);
  }

  function openEdit(process: Process) {
    setEditingProcess(process);
    setSheetOpen(true);
  }

  async function handleToggleStatus(process: Process) {
    const next: MasterStatus = process.status === "active" ? "inactive" : "active";
    await setStatusMutation.mutateAsync({ id: process.id, status: next });
    toast.success(`${process.name} marked ${next}`);
  }

  const columns: MasterDataColumn<Process>[] = [
    { key: "sequence", header: "Seq", render: (p) => p.sequence },
    { key: "code", header: "Code", render: (p) => <span className="font-medium text-foreground">{p.code}</span> },
    { key: "name", header: "Name", render: (p) => p.name },
    { key: "department", header: "Department", render: (p) => departmentName(p.departmentId) },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusBadge label={activeStatusMeta[p.status].label} level={activeStatusMeta[p.status].level} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => (
        <RowActionsMenu status={p.status} onEdit={() => openEdit(p)} onToggleStatus={() => handleToggleStatus(p)} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Processes"
        description="Configurable operations — cutting, sewing, washing and beyond. The workflow they form is not fixed."
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add Process
          </Button>
        }
      />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search processes…">
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
          icon={ListOrdered}
          title="No processes match your filters"
          description="Try a different search term or status, or add a new process."
        />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} />
          <MasterDataCards
            rows={filtered}
            renderCard={(p) => (
              <Card className="flex items-center justify-between p-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {p.sequence}. {p.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Code: {p.code} · {departmentName(p.departmentId)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={activeStatusMeta[p.status].label} level={activeStatusMeta[p.status].level} hideIcon />
                  <RowActionsMenu status={p.status} onEdit={() => openEdit(p)} onToggleStatus={() => handleToggleStatus(p)} />
                </div>
              </Card>
            )}
          />
        </>
      )}

      <ProcessFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        process={editingProcess}
        existingProcesses={processes}
      />
    </div>
  );
}
