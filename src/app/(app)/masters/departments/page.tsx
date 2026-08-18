import type { Metadata } from "next";
import { Suspense } from "react";

import { DepartmentsView } from "@/features/departments/departments-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Departments",
};

export default function DepartmentsPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <DepartmentsView />
    </Suspense>
  );
}
