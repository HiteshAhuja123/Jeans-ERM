import type { Metadata } from "next";
import { Suspense } from "react";

import { PackingView } from "@/features/packing/packing-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Packing" };

export default function PackingPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <PackingView />
    </Suspense>
  );
}
