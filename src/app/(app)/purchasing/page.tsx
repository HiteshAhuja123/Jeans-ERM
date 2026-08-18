import type { Metadata } from "next";
import { Suspense } from "react";

import { PurchasingView } from "@/features/purchasing/purchasing-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Purchasing",
};

export default function PurchasingPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <PurchasingView />
    </Suspense>
  );
}
