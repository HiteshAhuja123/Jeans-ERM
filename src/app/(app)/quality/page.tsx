import type { Metadata } from "next";
import { Suspense } from "react";

import { QualityView } from "@/features/quality/quality-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Quality",
};

export default function QualityPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <QualityView />
    </Suspense>
  );
}
