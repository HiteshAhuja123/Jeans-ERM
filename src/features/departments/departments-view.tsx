"use client";

import { useMemo, useState } from "react";
import { Building2, Plus } from "lucide-react";
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
import { departmentHooks } from "@/features/departments/service";
import { DepartmentFormSheet } from "@/features/departments/department-form-sheet";
import type { Department, MasterStatus } from "@/types";

type StatusFilter = MasterStatus | "all";

export function DepartmentsView() {
  const { data: departments = [], isLoading } = departmentHooks.useList();
  const setStatusMutation = departmentHooks.useSetStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | undefined>();

  const filtered = useMemo(() => {
    return departments
      .filter((d) => statusFilter === "all" || d.status === statusFilter)
      .filter((d) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return d.code.toLowerCase().includes(q) || d.name.toLowerCase().includes(q);
      });
  }, [departments, search, statusFilter]);

  function openCreate() {
    setEditingDepartment(undefined);
    setSheetOpen(true);
  }

  function openEdit(department: Department) {
    setEditingDepartment(department);
    setSheetOpen(true);
  }

  async function handleToggleStatus(department: Department) {
    const next: MasterStatus = department.status === "active" ? "inactive" : "active";
    await setStatusMutation.mutateAsync({ id: department.id, status: next });
    toast.success(`${department.name} marked ${next}`);
  }

  const columns: MasterDataColumn<Department>[] = [
    { key: "code", header: "Code", render: (d) => <span className="font-medium text-foreground">{d.code}</span> },
    { key: "name", header: "Name", render: (d) => d.name },
    { key: "description", header: "Description", render: (d) => d.description || "—" },
    {
      key: "status",
      header: "Status",
      render: (d) => <StatusBadge label={activeStatusMeta[d.status].label} level={activeStatusMeta[d.status].level} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (d) => (
        <RowActionsMenu status={d.status} onEdit={() => openEdit(d)} onToggleStatus={() => handleToggleStatus(d)} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Departments"
        description="Configurable departments used across production lines, machines and employees"
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add Department
          </Button>
        }
      />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search departments…">
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
          icon={Building2}
          title="No departments match your filters"
          description="Try a different search term or status, or add a new department."
        />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} />
          <MasterDataCards
            rows={filtered}
            renderCard={(d) => (
              <Card className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{d.name}</span>
                    <span className="text-xs text-muted-foreground">Code: {d.code}</span>
                  </div>
                  <StatusBadge label={activeStatusMeta[d.status].label} level={activeStatusMeta[d.status].level} hideIcon />
                </div>
                {d.description && <p className="text-sm text-muted-foreground">{d.description}</p>}
                <div className="flex justify-end">
                  <RowActionsMenu status={d.status} onEdit={() => openEdit(d)} onToggleStatus={() => handleToggleStatus(d)} />
                </div>
              </Card>
            )}
          />
        </>
      )}

      <DepartmentFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        department={editingDepartment}
        existingDepartments={departments}
      />
    </div>
  );
}
