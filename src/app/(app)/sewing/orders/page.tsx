import type { Metadata } from "next";
import { Suspense } from "react";

import { SewingOrdersView } from "@/features/sewing/sewing-orders-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Sewing Orders" };

export default function SewingOrdersPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <SewingOrdersView />
    </Suspense>
  );
}
