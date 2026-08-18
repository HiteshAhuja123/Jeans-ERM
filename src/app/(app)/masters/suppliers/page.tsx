import type { Metadata } from "next";
import { Suspense } from "react";

import { SuppliersListView } from "@/features/suppliers/suppliers-list-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Suppliers",
};

export default function SuppliersPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <SuppliersListView />
    </Suspense>
  );
}
