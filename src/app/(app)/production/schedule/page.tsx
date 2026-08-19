import type { Metadata } from "next";
import { Suspense } from "react";

import { ScheduleView } from "@/features/production/schedule-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Production Schedule" };

export default function ProductionSchedulePage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <ScheduleView />
    </Suspense>
  );
}
