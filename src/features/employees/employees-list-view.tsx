"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
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
import { employeeHooks } from "@/features/employees/service";
import { EmployeeFormSheet } from "@/features/employees/employee-form-sheet";
import { mockDepartments } from "@/mock-data";
import type { Employee, MasterStatus } from "@/types";

type StatusFilter = MasterStatus | "all";

function departmentName(departmentId: string) {
  return mockDepartments.find((d) => d.id === departmentId)?.name ?? "—";
}

export function EmployeesListView() {
  const router = useRouter();
  const { data: employees = [], isLoading } = employeeHooks.useList();
  const setStatusMutation = employeeHooks.useSetStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();

  const filtered = useMemo(() => {
    return employees
      .filter((e) => statusFilter === "all" || e.status === statusFilter)
      .filter((e) => departmentFilter === "all" || e.departmentId === departmentFilter)
      .filter((e) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q) || e.designation.toLowerCase().includes(q);
      });
  }, [employees, search, statusFilter, departmentFilter]);

  function openCreate() {
    setEditingEmployee(undefined);
    setSheetOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditingEmployee(employee);
    setSheetOpen(true);
  }

  async function handleToggleStatus(employee: Employee) {
    const next: MasterStatus = employee.status === "active" ? "inactive" : "active";
    await setStatusMutation.mutateAsync({ id: employee.id, status: next });
    toast.success(`${employee.name} marked ${next}`);
  }

  const columns: MasterDataColumn<Employee>[] = [
    { key: "code", header: "Code", render: (e) => <span className="font-medium text-foreground">{e.code}</span> },
    { key: "name", header: "Name", render: (e) => e.name },
    { key: "designation", header: "Designation", render: (e) => e.designation },
    { key: "department", header: "Department", render: (e) => departmentName(e.departmentId) },
    {
      key: "status",
      header: "Status",
      render: (e) => <StatusBadge label={activeStatusMeta[e.status].label} level={activeStatusMeta[e.status].level} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (e) => (
        <RowActionsMenu
          status={e.status}
          onView={() => router.push(`/masters/employees/${e.id}`)}
          onEdit={() => openEdit(e)}
          onToggleStatus={() => handleToggleStatus(e)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employees"
        description="Operational staff master — departments, roles and contact details"
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add Employee
          </Button>
        }
      />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by name, code, designation…">
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {mockDepartments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          icon={Users}
          title="No employees match your filters"
          description="Try a different search term, department or status, or add a new employee."
        />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} onRowClick={(e) => router.push(`/masters/employees/${e.id}`)} />
          <MasterDataCards
            rows={filtered}
            renderCard={(e) => (
              <Card className="flex items-center justify-between p-4" onClick={() => router.push(`/masters/employees/${e.id}`)}>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{e.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {e.designation} · {departmentName(e.departmentId)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={activeStatusMeta[e.status].label} level={activeStatusMeta[e.status].level} hideIcon />
                  <RowActionsMenu status={e.status} onEdit={() => openEdit(e)} onToggleStatus={() => handleToggleStatus(e)} />
                </div>
              </Card>
            )}
          />
        </>
      )}

      <EmployeeFormSheet open={sheetOpen} onOpenChange={setSheetOpen} employee={editingEmployee} existingEmployees={employees} />
    </div>
  );
}
