"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserX } from "lucide-react";

import { DetailHeader } from "@/components/shared/detail-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { activeStatusMeta, orderStatusMeta } from "@/lib/status";
import { formatDate } from "@/lib/format";
import { customerHooks } from "@/features/customers/service";
import { CustomerFormSheet } from "@/features/customers/customer-form-sheet";
import { mockOrders } from "@/mock-data";

const typeLabels: Record<string, string> = {
  brand: "Brand",
  retailer: "Retailer",
  wholesaler: "Wholesaler",
  individual: "Individual",
};

export function CustomerDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: customer, isLoading } = customerHooks.useDetail(id);
  const { data: customers = [] } = customerHooks.useList();
  const [sheetOpen, setSheetOpen] = useState(false);

  const orders = useMemo(() => mockOrders.filter((o) => o.customerId === id), [id]);

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

  if (!customer) {
    return (
      <EmptyState
        icon={UserX}
        title="Customer not found"
        description="This customer may have been removed."
        action={{ label: "Back to Customers", onClick: () => router.push("/masters/customers") }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/masters/customers"
        backLabel="Back to Customers"
        title={customer.name}
        subtitle={`${customer.code} · ${typeLabels[customer.type]}`}
        statusLabel={activeStatusMeta[customer.status].label}
        statusLevel={activeStatusMeta[customer.status].level}
        onEdit={() => setSheetOpen(true)}
        tabs={
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Contact Person</span>
                  <span className="text-sm font-medium text-foreground">{customer.contactPerson}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Email</span>
                  <span className="text-sm font-medium text-foreground">{customer.email}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Phone</span>
                  <span className="text-sm font-medium text-foreground">{customer.phone}</span>
                </div>
                <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-3">
                  <span className="text-xs text-muted-foreground">Address</span>
                  <span className="text-sm font-medium text-foreground">
                    {customer.address ? `${customer.address}, ` : ""}
                    {customer.location}
                  </span>
                </div>
                {customer.notes && (
                  <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-3">
                    <span className="text-xs text-muted-foreground">Notes</span>
                    <span className="text-sm text-foreground">{customer.notes}</span>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="mt-4">
              {orders.length === 0 ? (
                <EmptyState icon={UserX} title="No orders yet" description="Orders placed by this customer will appear here." />
              ) : (
                <div className="flex flex-col gap-3">
                  {orders.map((order) => {
                    const meta = orderStatusMeta[order.status];
                    return (
                      <Card
                        key={order.id}
                        className="flex cursor-pointer items-center justify-between p-4 hover:border-primary/40"
                        onClick={() => router.push(`/orders/${order.id}`)}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{order.orderNumber}</span>
                          <span className="text-xs text-muted-foreground">
                            {order.lineItems.length} style{order.lineItems.length === 1 ? "" : "s"} ·{" "}
                            {order.quantity.toLocaleString()} pcs · Due {formatDate(order.dueDate)}
                          </span>
                        </div>
                        <StatusBadge label={meta.label} level={meta.level} />
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <EmptyState icon={UserX} title="Activity coming soon" description="A timeline of changes for this customer will appear here in a later phase." />
            </TabsContent>
          </Tabs>
        }
      />

      <CustomerFormSheet open={sheetOpen} onOpenChange={setSheetOpen} customer={customer} existingCustomers={customers} />
    </div>
  );
}
