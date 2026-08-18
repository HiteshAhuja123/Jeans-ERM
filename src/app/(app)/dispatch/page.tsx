import type { Metadata } from "next";
import { Suspense } from "react";

import { DispatchView } from "@/features/dispatch/dispatch-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Packing & Dispatch",
};

export default function DispatchPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <DispatchView />
    </Suspense>
  );
}
