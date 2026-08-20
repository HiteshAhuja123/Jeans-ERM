import type { Metadata } from "next";
import { Suspense } from "react";

import { SewingOrderDetailView } from "@/features/sewing/sewing-order-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Sewing Order" };

export default async function SewingOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <SewingOrderDetailView id={id} />
    </Suspense>
  );
}
