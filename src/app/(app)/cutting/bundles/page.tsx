import type { Metadata } from "next";
import { Suspense } from "react";

import { BundlesView } from "@/features/cutting/bundles-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Bundles" };

export default function BundlesPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <BundlesView />
    </Suspense>
  );
}
