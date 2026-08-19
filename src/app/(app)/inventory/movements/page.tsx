import type { Metadata } from "next";
import { Suspense } from "react";

import { MovementsView } from "@/features/inventory/movements-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Stock Movements" };

export default function MovementsPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <MovementsView />
    </Suspense>
  );
}
