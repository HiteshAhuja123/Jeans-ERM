import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionStepper } from "@/components/shared/production-stepper";
import type { ProductionOrderProgress } from "@/types";

export function ProductionSnapshotCard({ orders }: { orders: ProductionOrderProgress[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Production in Progress</CardTitle>
        <Link href="/production" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border">
        {orders.map((order) => (
          <div key={order.orderId} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <Link
                href="/orders"
                className="text-sm font-semibold text-foreground hover:text-primary hover:underline"
              >
                {order.orderNumber}
              </Link>
              <span className="text-xs text-muted-foreground">
                {order.customerName} · {order.styleCode} · {order.totalQuantity.toLocaleString()} pcs
              </span>
            </div>
            <ProductionStepper stages={order.stages} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
