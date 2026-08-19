import type { Metadata } from "next";
import { Suspense } from "react";

import { CuttingOrderDetailView } from "@/features/cutting/cutting-order-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Cutting Order" };

export default async function CuttingOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <CuttingOrderDetailView id={id} />
    </Suspense>
  );
}
