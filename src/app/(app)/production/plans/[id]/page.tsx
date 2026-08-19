import type { Metadata } from "next";
import { Suspense } from "react";

import { PlanDetailView } from "@/features/production/plan-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Production Plan" };

export default async function ProductionPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <PlanDetailView id={id} />
    </Suspense>
  );
}
