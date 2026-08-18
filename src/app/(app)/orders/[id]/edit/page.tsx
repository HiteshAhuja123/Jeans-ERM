import type { Metadata } from "next";
import { Suspense } from "react";

import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";
import { OrderEditView } from "@/features/orders/order-edit-view";

export const metadata: Metadata = { title: "Edit Order" };

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <OrderEditView id={id} />
    </Suspense>
  );
}
