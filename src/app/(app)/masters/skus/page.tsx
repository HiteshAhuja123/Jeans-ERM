import type { Metadata } from "next";
import { Suspense } from "react";

import { SkusView } from "@/features/skus/skus-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "SKUs",
};

export default function SkusPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <SkusView />
    </Suspense>
  );
}
