import type { Metadata } from "next";
import { Suspense } from "react";

import { FinishingView } from "@/features/finishing/finishing-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Finishing" };

export default function FinishingPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <FinishingView />
    </Suspense>
  );
}
