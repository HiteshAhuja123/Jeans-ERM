import type { Metadata } from "next";
import { Suspense } from "react";

import { WarehouseDetailView } from "@/features/warehouses/warehouse-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Warehouse Details",
};

export default async function WarehouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <WarehouseDetailView id={id} />
    </Suspense>
  );
}
