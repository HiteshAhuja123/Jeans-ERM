"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserX } from "lucide-react";

import { DetailHeader } from "@/components/shared/detail-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { activeStatusMeta } from "@/lib/status";
import { employeeHooks } from "@/features/employees/service";
import { EmployeeFormSheet } from "@/features/employees/employee-form-sheet";
import { mockDepartments } from "@/mock-data";

export function EmployeeDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: employee, isLoading } = employeeHooks.useDetail(id);
  const { data: employees = [] } = employeeHooks.useList();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-64" />
        <Card className="p-5">
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    );
  }

  if (!employee) {
    return (
      <EmptyState
        icon={UserX}
        title="Employee not found"
        description="This employee may have been removed."
        action={{ label: "Back to Employees", onClick: () => router.push("/masters/employees") }}
      />
    );
  }

  const department = mockDepartments.find((d) => d.id === employee.departmentId);

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/masters/employees"
        backLabel="Back to Employees"
        title={employee.name}
        subtitle={`${employee.code} · ${employee.designation}`}
        statusLabel={activeStatusMeta[employee.status].label}
        statusLevel={activeStatusMeta[employee.status].level}
        onEdit={() => setSheetOpen(true)}
        tabs={
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Department</span>
                  <span className="text-sm font-medium text-foreground">{department?.name ?? "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Designation</span>
                  <span className="text-sm font-medium text-foreground">{employee.designation}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Phone</span>
                  <span className="text-sm font-medium text-foreground">{employee.phone}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Email</span>
                  <span className="text-sm font-medium text-foreground">{employee.email || "Not set"}</span>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <EmptyState
                icon={UserX}
                title="Activity coming soon"
                description="A timeline of shifts, transfers and attendance will appear here in a later phase."
              />
            </TabsContent>
          </Tabs>
        }
      />

      <EmployeeFormSheet open={sheetOpen} onOpenChange={setSheetOpen} employee={employee} existingEmployees={employees} />
    </div>
  );
}
