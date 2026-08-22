import type { Metadata } from "next";
import { Suspense } from "react";

import { ReportsView } from "@/features/reports/reports-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Reports",
};

export default function ReportsPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <ReportsView />
    </Suspense>
  );
}
