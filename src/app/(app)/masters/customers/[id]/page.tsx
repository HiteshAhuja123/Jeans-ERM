import type { Metadata } from "next";
import { Suspense } from "react";

import { CustomerDetailView } from "@/features/customers/customer-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Customer Details",
};

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <CustomerDetailView id={id} />
    </Suspense>
  );
}
