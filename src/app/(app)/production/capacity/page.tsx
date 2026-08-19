import type { Metadata } from "next";
import { Suspense } from "react";

import { CapacityView } from "@/features/production/capacity-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Capacity Overview" };

export default function CapacityOverviewPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <CapacityView />
    </Suspense>
  );
}
