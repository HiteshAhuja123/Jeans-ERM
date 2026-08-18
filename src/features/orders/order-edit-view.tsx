"use client";

import { useRouter } from "next/navigation";
import { PackageX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { orderHooks } from "@/features/orders/service";
import { OrderWizard } from "@/features/orders/wizard/order-wizard";

export function OrderEditView({ id }: { id: string }) {
  const router = useRouter();
  const { data: order, isLoading } = orderHooks.useDetail(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState
        icon={PackageX}
        title="Order not found"
        description="This order may have been removed."
        action={{ label: "Back to Orders", onClick: () => router.push("/orders") }}
      />
    );
  }

  return <OrderWizard mode="edit" order={order} />;
}
