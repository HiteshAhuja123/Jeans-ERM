import type { Metadata } from "next";
import { Suspense } from "react";

import { MaterialsListView } from "@/features/materials/materials-list-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Materials",
};

export default function MaterialsPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <MaterialsListView />
    </Suspense>
  );
}
