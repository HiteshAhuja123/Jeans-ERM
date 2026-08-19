import type { Metadata } from "next";
import { Suspense } from "react";

import { GoodsReceiptView } from "@/features/purchasing/goods-receipt-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Receive Material" };

export default async function ReceiveMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <GoodsReceiptView id={id} />
    </Suspense>
  );
}
