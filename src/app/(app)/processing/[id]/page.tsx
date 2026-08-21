import type { Metadata } from "next";
import { Suspense } from "react";

import { ProcessingOrderDetailView } from "@/features/processing/processing-order-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Processing Order" };

export default async function ProcessingOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <ProcessingOrderDetailView id={id} />
    </Suspense>
  );
}
