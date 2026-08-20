import type { Metadata } from "next";
import { Suspense } from "react";

import { OperationsView } from "@/features/sewing-operations/operations-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Sewing Operations" };

export default function SewingOperationsPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <OperationsView />
    </Suspense>
  );
}
