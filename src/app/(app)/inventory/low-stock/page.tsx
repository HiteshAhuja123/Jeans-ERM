import type { Metadata } from "next";
import { Suspense } from "react";

import { LowStockView } from "@/features/inventory/low-stock-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Low Stock" };

export default function LowStockPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <LowStockView />
    </Suspense>
  );
}
