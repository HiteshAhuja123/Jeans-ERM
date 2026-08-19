import type { Metadata } from "next";
import { Suspense } from "react";

import { CuttingOrdersView } from "@/features/cutting/cutting-orders-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Cutting Orders" };

export default function CuttingOrdersPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <CuttingOrdersView />
    </Suspense>
  );
}
