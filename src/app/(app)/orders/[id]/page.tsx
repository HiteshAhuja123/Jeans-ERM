import type { Metadata } from "next";
import { Suspense } from "react";

import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";
import { OrderDetailView } from "@/features/orders/order-detail-view";

export const metadata: Metadata = { title: "Order Details" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <OrderDetailView id={id} />
    </Suspense>
  );
}
