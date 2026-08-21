import type { Metadata } from "next";
import { Suspense } from "react";

import { FinishingOrderDetailView } from "@/features/finishing/finishing-order-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Finishing Order" };

export default async function FinishingOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <FinishingOrderDetailView id={id} />
    </Suspense>
  );
}
