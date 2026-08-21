import type { Metadata } from "next";
import { Suspense } from "react";

import { QcOrderDetailView } from "@/features/quality/qc-order-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "QC Order" };

export default async function QcOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <QcOrderDetailView id={id} />
    </Suspense>
  );
}
