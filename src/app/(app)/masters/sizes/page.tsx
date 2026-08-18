import type { Metadata } from "next";
import { Suspense } from "react";

import { SizesView } from "@/features/sizes/sizes-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Sizes",
};

export default function SizesPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <SizesView />
    </Suspense>
  );
}
