import type { Metadata } from "next";
import { Suspense } from "react";

import { PurchaseOrderForm } from "@/features/purchasing/purchase-order-form";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "New Purchase Order" };

export default function NewPurchaseOrderPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <PurchaseOrderForm />
    </Suspense>
  );
}
