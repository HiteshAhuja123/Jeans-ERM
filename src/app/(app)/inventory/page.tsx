import type { Metadata } from "next";
import { Suspense } from "react";

import { InventoryView } from "@/features/inventory/inventory-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Inventory",
};

export default function InventoryPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <InventoryView />
    </Suspense>
  );
}
