import type { Metadata } from "next";
import { Suspense } from "react";

import { EmployeeDetailView } from "@/features/employees/employee-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Employee Details",
};

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <EmployeeDetailView id={id} />
    </Suspense>
  );
}
