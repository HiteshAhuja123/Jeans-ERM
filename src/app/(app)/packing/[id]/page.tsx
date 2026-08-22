import type { Metadata } from "next";
import { Suspense } from "react";

import { PackingOrderDetailView } from "@/features/packing/packing-order-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Packing Order" };

export default async function PackingOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <PackingOrderDetailView id={id} />
    </Suspense>
  );
}
