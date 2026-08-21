import type { Metadata } from "next";
import { Suspense } from "react";

import { ProcessingTypesView } from "@/features/processing-types/processing-types-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Processing Types" };

export default function ProcessingTypesPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <ProcessingTypesView />
    </Suspense>
  );
}
