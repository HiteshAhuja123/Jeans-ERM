import type { Metadata } from "next";
import { Suspense } from "react";

import { WarehousesListView } from "@/features/warehouses/warehouses-list-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Warehouses",
};

export default function WarehousesPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <WarehousesListView />
    </Suspense>
  );
}
