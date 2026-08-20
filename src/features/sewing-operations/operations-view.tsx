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
import { sewingOperationHooks, mockSewingLineOperationAssignments } from "@/features/sewing-operations/service";
import { OperationFormSheet } from "@/features/sewing-operations/operation-form-sheet";
import { mockEmployees, mockProductionLineMasters } from "@/mock-data";
import type { MasterStatus, SewingOperation } from "@/types";

type StatusFilter = MasterStatus | "all";

export function OperationsView() {
  const { data: operations = [], isLoading } = sewingOperationHooks.useList();
  const setStatusMutation = sewingOperationHooks.useSetStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<SewingOperation | undefined>();

  const filtered = useMemo(() => {
    return [...operations]
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .filter((o) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return o.code.toLowerCase().includes(q) || o.name.toLowerCase().includes(q);
      })
      .sort((a, b) => a.sequence - b.sequence);
  }, [operations, search, statusFilter]);

  function openCreate() {
    setEditingOperation(undefined);
    setSheetOpen(true);
  }

  function openEdit(operation: SewingOperation) {
    setEditingOperation(operation);
    setSheetOpen(true);
  }

  async function handleToggleStatus(operation: SewingOperation) {
    const next: MasterStatus = operation.status === "active" ? "inactive" : "active";
    await setStatusMutation.mutateAsync({ id: operation.id, status: next });
    toast.success(`${operation.name} marked ${next}`);
  }

  const columns: MasterDataColumn<SewingOperation>[] = [
    { key: "sequence", header: "Seq", render: (o) => o.sequence },
    { key: "code", header: "Code", render: (o) => <span className="font-medium text-foreground">{o.code}</span> },
    { key: "name", header: "Name", render: (o) => o.name },
    {
      key: "status",
      header: "Status",
      render: (o) => <StatusBadge label={activeStatusMeta[o.status].label} level={activeStatusMeta[o.status].level} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (o) => (
        <RowActionsMenu status={o.status} onEdit={() => openEdit(o)} onToggleStatus={() => handleToggleStatus(o)} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sewing Operations"
        description="The steps a garment moves through on the sewing line — Pocket Attachment, Side Seam, Hem and so on."
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add Operation
          </Button>
        }
      />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search operations…">
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
          title="No operations match your filters"
          description="Try a different search term or status, or add a new operation."
        />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} />
          <MasterDataCards
            rows={filtered}
            renderCard={(o) => (
              <Card className="flex items-center justify-between p-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {o.sequence}. {o.name}
                  </span>
                  <span className="text-xs text-muted-foreground">Code: {o.code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={activeStatusMeta[o.status].label} level={activeStatusMeta[o.status].level} hideIcon />
                  <RowActionsMenu status={o.status} onEdit={() => openEdit(o)} onToggleStatus={() => handleToggleStatus(o)} />
                </div>
              </Card>
            )}
          />
        </>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-foreground">Line Operation Assignments</h2>
          <p className="text-xs text-muted-foreground">Which operator runs which operation on each line — a basic association, not a line-balancing engine.</p>
        </div>
        <Card className="flex flex-col divide-y divide-border overflow-hidden p-0">
          {mockProductionLineMasters
            .filter((line) => mockSewingLineOperationAssignments.some((a) => a.productionLineId === line.id))
            .map((line) => (
              <div key={line.id} className="flex flex-col gap-2 p-4">
                <span className="text-sm font-semibold text-foreground">{line.name}</span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {mockSewingLineOperationAssignments
                    .filter((a) => a.productionLineId === line.id)
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((assignment) => {
                      const operation = operations.find((o) => o.id === assignment.operationId);
                      const operator = mockEmployees.find((e) => e.id === assignment.operatorId);
                      return (
                        <div key={assignment.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                          <span className="text-foreground">{operation?.name ?? assignment.operationId}</span>
                          <span className="text-muted-foreground">{operator?.name ?? "Unassigned"}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
        </Card>
      </div>

      <OperationFormSheet open={sheetOpen} onOpenChange={setSheetOpen} operation={editingOperation} existingOperations={operations} />
    </div>
  );
}
