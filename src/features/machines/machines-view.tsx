"use client";

import { useMemo, useState } from "react";
import { Cog, Plus } from "lucide-react";
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
import { machineStatusMeta } from "@/lib/status";
import { machineHooks } from "@/features/machines/service";
import { MachineFormSheet } from "@/features/machines/machine-form-sheet";
import { mockDepartments } from "@/mock-data";
import type { Machine, MachineStatus } from "@/types";

type StatusFilter = MachineStatus | "all";

function departmentName(departmentId: string) {
  return mockDepartments.find((d) => d.id === departmentId)?.name ?? "—";
}

export function MachinesView() {
  const { data: machines = [], isLoading } = machineHooks.useList();
  const setStatusMutation = machineHooks.useSetStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | undefined>();

  const filtered = useMemo(() => {
    return machines
      .filter((m) => statusFilter === "all" || m.status === statusFilter)
      .filter((m) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
      });
  }, [machines, search, statusFilter]);

  function openCreate() {
    setEditingMachine(undefined);
    setSheetOpen(true);
  }

  function openEdit(machine: Machine) {
    setEditingMachine(machine);
    setSheetOpen(true);
  }

  async function handleToggleStatus(machine: Machine) {
    const next: MachineStatus = machine.status === "inactive" ? "available" : "inactive";
    await setStatusMutation.mutateAsync({ id: machine.id, status: next });
    toast.success(`${machine.name} marked ${next}`);
  }

  const columns: MasterDataColumn<Machine>[] = [
    { key: "code", header: "Code", render: (m) => <span className="font-medium text-foreground">{m.code}</span> },
    { key: "name", header: "Name", render: (m) => m.name },
    { key: "type", header: "Type", render: (m) => m.machineType },
    { key: "department", header: "Department", render: (m) => departmentName(m.departmentId) },
    {
      key: "status",
      header: "Status",
      render: (m) => <StatusBadge label={machineStatusMeta[m.status].label} level={machineStatusMeta[m.status].level} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (m) => (
        <RowActionsMenu
          status={m.status === "inactive" ? "inactive" : "active"}
          onEdit={() => openEdit(m)}
          onToggleStatus={() => handleToggleStatus(m)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Machines"
        description="Machines assigned to departments and production lines"
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add Machine
          </Button>
        }
      />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search machines…">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
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
        <EmptyState icon={Cog} title="No machines match your filters" description="Try a different search term or status, or add a new machine." />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} />
          <MasterDataCards
            rows={filtered}
            renderCard={(m) => (
              <Card className="flex items-center justify-between p-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{m.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {m.code} · {departmentName(m.departmentId)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={machineStatusMeta[m.status].label} level={machineStatusMeta[m.status].level} hideIcon />
                  <RowActionsMenu
                    status={m.status === "inactive" ? "inactive" : "active"}
                    onEdit={() => openEdit(m)}
                    onToggleStatus={() => handleToggleStatus(m)}
                  />
                </div>
              </Card>
            )}
          />
        </>
      )}

      <MachineFormSheet open={sheetOpen} onOpenChange={setSheetOpen} machine={editingMachine} existingMachines={machines} />
    </div>
  );
}
