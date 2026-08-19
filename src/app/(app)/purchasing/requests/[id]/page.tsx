import type { Metadata } from "next";
import { Suspense } from "react";

import { PurchaseRequestDetailView } from "@/features/purchasing/purchase-request-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Purchase Request" };

export default async function PurchaseRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <PurchaseRequestDetailView id={id} />
    </Suspense>
  );
}
