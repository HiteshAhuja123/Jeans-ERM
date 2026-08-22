import type { Metadata } from "next";
import { Suspense } from "react";

import { FinishedGoodsListView } from "@/features/inventory/finished-goods-list-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Finished Goods" };

export default function FinishedGoodsPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <FinishedGoodsListView />
    </Suspense>
  );
}
