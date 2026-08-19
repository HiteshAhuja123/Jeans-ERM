import type { Metadata } from "next";
import { Suspense } from "react";

import { CuttingDashboardView } from "@/features/cutting/cutting-dashboard-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Cutting" };

export default function CuttingPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <CuttingDashboardView />
    </Suspense>
  );
}
