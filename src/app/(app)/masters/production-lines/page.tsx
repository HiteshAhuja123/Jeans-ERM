import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductionLinesView } from "@/features/production-lines/production-lines-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Production Lines",
};

export default function ProductionLinesPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <ProductionLinesView />
    </Suspense>
  );
}
