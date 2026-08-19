import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductionOrderDetailView } from "@/features/production/production-order-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Production Order" };

export default async function ProductionOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <ProductionOrderDetailView id={id} />
    </Suspense>
  );
}
