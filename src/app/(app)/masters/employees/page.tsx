import type { Metadata } from "next";
import { Suspense } from "react";

import { EmployeesListView } from "@/features/employees/employees-list-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Employees",
};

export default function EmployeesPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <EmployeesListView />
    </Suspense>
  );
}
