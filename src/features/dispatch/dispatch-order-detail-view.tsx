"use client";

import { useRouter } from "next/navigation";
import { PackageX } from "lucide-react";

import { DetailHeader } from "@/components/shared/detail-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";
import { dispatchOrderStatusMeta } from "@/lib/status";
import { DispatchOrderStatusMenu } from "@/features/dispatch/dispatch-order-status-menu";
import { dispatchOrderHooks } from "@/features/dispatch/service";
import { buildDispatchOrderActivity } from "@/mock-data/dispatch-activity";

export function DispatchOrderDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: order, isLoading } = dispatchOrderHooks.useDetail(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-64" />
        <Card className="p-5">
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState
        icon={PackageX}
        title="Dispatch not found"
        description="This dispatch may have been removed."
        action={{ label: "Back to Dispatch", onClick: () => router.push("/dispatch") }}
      />
    );
  }

  const statusMeta = dispatchOrderStatusMeta[order.status];
  const activity = buildDispatchOrderActivity(order);

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/dispatch"
        backLabel="Back to Dispatch"
        title={order.dispatchOrderNumber}
        subtitle={`${order.orderNumber} · ${order.customerName} · ${order.quantity.toLocaleString()} pcs`}
        statusLabel={statusMeta.label}
        statusLevel={statusMeta.level}
        actions={<DispatchOrderStatusMenu dispatchOrder={order} />}
        tabs={
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="lines">Line Items ({order.lineItems.length})</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Customer Order</span>
                  <button type="button" onClick={() => router.push(`/orders/${order.orderId}`)} className="w-fit text-left text-sm font-medium text-primary hover:underline">
                    {order.orderNumber}
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Customer</span>
                  <span className="text-sm font-medium text-foreground">{order.customerName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Total Quantity</span>
                  <span className="text-sm font-medium text-foreground">{order.quantity.toLocaleString()} {order.unit}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Carrier</span>
                  <span className="text-sm font-medium text-foreground">{order.carrier ?? "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Tracking Reference</span>
                  <span className="text-sm font-medium text-foreground">{order.trackingRef ?? "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Dispatch Date</span>
                  <span className="text-sm font-medium text-foreground">{formatDate(order.dispatchDate)}</span>
                </div>
                {order.deliveredDate && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Delivered Date</span>
                    <span className="text-sm font-medium text-foreground">{formatDate(order.deliveredDate)}</span>
                  </div>
                )}
                {order.notes && (
                  <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-3">
                    <span className="text-xs text-muted-foreground">Notes</span>
                    <span className="text-sm text-foreground">{order.notes}</span>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="lines" className="mt-4">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Production Order</TableHead>
                      <TableHead>Style</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.lineItems.map((line) => (
                      <TableRow key={line.id} className="cursor-pointer" onClick={() => router.push(`/inventory/finished-goods/${line.productionOrderId}`)}>
                        <TableCell className="font-medium text-foreground">{line.productionOrderNumber}</TableCell>
                        <TableCell>{line.styleCode}</TableCell>
                        <TableCell>{line.colorName}</TableCell>
                        <TableCell className="text-right tabular-nums">{line.quantity.toLocaleString()} {line.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <div className="flex flex-col gap-3">
                {activity.map((entry) => (
                  <Card key={entry.id} className="flex items-start justify-between gap-3 p-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">{entry.action}</span>
                      <span className="text-xs text-muted-foreground">{entry.actor}</span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(entry.timestamp)}</span>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        }
      />
    </div>
  );
}
