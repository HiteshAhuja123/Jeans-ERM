import type { Metadata } from "next";
import { Suspense } from "react";

import { SupplierDetailView } from "@/features/suppliers/supplier-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Supplier Details",
};

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <SupplierDetailView id={id} />
    </Suspense>
  );
}
