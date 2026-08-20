import type { Metadata } from "next";
import { Suspense } from "react";

import { SewingDashboardView } from "@/features/sewing/sewing-dashboard-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Sewing" };

export default function SewingPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <SewingDashboardView />
    </Suspense>
  );
}
