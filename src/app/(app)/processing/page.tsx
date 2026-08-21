import type { Metadata } from "next";
import { Suspense } from "react";

import { ProcessingView } from "@/features/processing/processing-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Processing" };

export default function ProcessingPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <ProcessingView />
    </Suspense>
  );
}
