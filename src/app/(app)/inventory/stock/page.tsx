import type { Metadata } from "next";
import { Suspense } from "react";

import { InventoryListView } from "@/features/inventory/inventory-list-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Inventory Stock" };

export default function InventoryStockPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <InventoryListView />
    </Suspense>
  );
}
