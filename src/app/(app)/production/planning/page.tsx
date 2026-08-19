import type { Metadata } from "next";
import { Suspense } from "react";

import { PlanningBoardView } from "@/features/production/planning-board-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Production Planning" };

export default function ProductionPlanningPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <PlanningBoardView />
    </Suspense>
  );
}
