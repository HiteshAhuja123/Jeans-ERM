import type { Metadata } from "next";
import { Suspense } from "react";

import { PurchasingHubView } from "@/features/purchasing/purchasing-hub-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Purchasing",
};

export default function PurchasingPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <PurchasingHubView />
    </Suspense>
  );
}
