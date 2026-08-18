import type { Metadata } from "next";
import { Suspense } from "react";

import { OrdersView } from "@/features/orders/orders-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Orders",
};

export default function OrdersPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <OrdersView />
    </Suspense>
  );
}
