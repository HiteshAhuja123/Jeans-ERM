import type { Metadata } from "next";
import { Suspense } from "react";

import { FinishedGoodsDetailView } from "@/features/inventory/finished-goods-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Finished Goods" };

export default async function FinishedGoodsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <FinishedGoodsDetailView id={id} />
    </Suspense>
  );
}
