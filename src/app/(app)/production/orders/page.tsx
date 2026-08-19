import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductionOrdersHubView } from "@/features/production/production-orders-hub-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Production Orders" };

export default function ProductionOrdersPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <ProductionOrdersHubView />
    </Suspense>
  );
}
