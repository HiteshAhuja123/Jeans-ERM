import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductsListView } from "@/features/products/products-list-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Products",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <ProductsListView />
    </Suspense>
  );
}
