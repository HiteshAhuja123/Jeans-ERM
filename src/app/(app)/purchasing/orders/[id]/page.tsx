import type { Metadata } from "next";
import { Suspense } from "react";

import { PurchaseOrderDetailView } from "@/features/purchasing/purchase-order-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Purchase Order" };

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <PurchaseOrderDetailView id={id} />
    </Suspense>
  );
}
