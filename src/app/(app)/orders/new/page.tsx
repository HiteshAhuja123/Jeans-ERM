import type { Metadata } from "next";
import { Suspense } from "react";

import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";
import { OrderWizard } from "@/features/orders/wizard/order-wizard";

export const metadata: Metadata = { title: "New Order" };

export default function NewOrderPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <OrderWizard mode="create" />
    </Suspense>
  );
}
