import type { Metadata } from "next";
import { Suspense } from "react";

import { CustomersListView } from "@/features/customers/customers-list-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Customers",
};

export default function CustomersPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <CustomersListView />
    </Suspense>
  );
}
