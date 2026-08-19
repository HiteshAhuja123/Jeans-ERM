import type { Metadata } from "next";
import { Suspense } from "react";

import { CreatePlanView } from "@/features/production/create-plan-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "New Production Plan" };

export default function NewProductionPlanPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <CreatePlanView />
    </Suspense>
  );
}
