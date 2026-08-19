import type { Metadata } from "next";
import { Suspense } from "react";

import { BundleDetailView } from "@/features/cutting/bundle-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Bundle" };

export default async function BundleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <BundleDetailView id={id} />
    </Suspense>
  );
}
