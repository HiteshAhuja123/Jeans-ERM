import type { Metadata } from "next";
import { Suspense } from "react";

import { InventoryDetailView } from "@/features/inventory/inventory-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Material Stock" };

export default async function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <InventoryDetailView id={id} />
    </Suspense>
  );
}
