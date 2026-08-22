import type { Metadata } from "next";
import { Suspense } from "react";

import { DispatchOrderDetailView } from "@/features/dispatch/dispatch-order-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Dispatch Order" };

export default async function DispatchOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <DispatchOrderDetailView id={id} />
    </Suspense>
  );
}
