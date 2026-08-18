import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductDetailView } from "@/features/products/product-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Product Details",
};

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <ProductDetailView id={id} />
    </Suspense>
  );
}
