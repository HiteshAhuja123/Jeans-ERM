"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, PackageX } from "lucide-react";

import { DetailHeader } from "@/components/shared/detail-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { activeStatusMeta, purchaseOrderStatusMeta } from "@/lib/status";
import { formatCurrency, formatDate } from "@/lib/format";
import { supplierHooks } from "@/features/suppliers/service";
import { SupplierFormSheet } from "@/features/suppliers/supplier-form-sheet";
import { mockMaterials, mockPurchaseOrders } from "@/mock-data";

const typeLabels: Record<string, string> = {
  fabric: "Fabric",
  accessories: "Accessories",
  packaging: "Packaging",
  washing_vendor: "Washing Vendor",
  processing_vendor: "Processing Vendor",
  other: "Other",
};

export function SupplierDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: supplier, isLoading } = supplierHooks.useDetail(id);
  const { data: suppliers = [] } = supplierHooks.useList();
  const [sheetOpen, setSheetOpen] = useState(false);

  const materials = useMemo(() => mockMaterials.filter((m) => m.supplierId === id), [id]);
  const purchaseOrders = useMemo(() => mockPurchaseOrders.filter((po) => po.supplierId === id), [id]);

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

  if (!supplier) {
    return (
      <EmptyState
        icon={PackageX}
        title="Supplier not found"
        description="This supplier may have been removed."
        action={{ label: "Back to Suppliers", onClick: () => router.push("/masters/suppliers") }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/masters/suppliers"
        backLabel="Back to Suppliers"
        title={supplier.name}
        subtitle={`${supplier.code} · ${typeLabels[supplier.type]}`}
        statusLabel={activeStatusMeta[supplier.status].label}
        statusLevel={activeStatusMeta[supplier.status].level}
        onEdit={() => setSheetOpen(true)}
        actions={
          <span className="flex items-center gap-1 text-sm font-medium text-foreground">
            <Star className="size-3.5 fill-warning text-warning" />
            {supplier.rating.toFixed(1)}
          </span>
        }
        tabs={
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="materials">Materials Supplied ({materials.length})</TabsTrigger>
              <TabsTrigger value="orders">Purchase Orders ({purchaseOrders.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Contact Person</span>
                  <span className="text-sm font-medium text-foreground">{supplier.contactPerson}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Email</span>
                  <span className="text-sm font-medium text-foreground">{supplier.email}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Phone</span>
                  <span className="text-sm font-medium text-foreground">{supplier.phone}</span>
                </div>
                <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-3">
                  <span className="text-xs text-muted-foreground">Address</span>
                  <span className="text-sm font-medium text-foreground">
                    {supplier.address ? `${supplier.address}, ` : ""}
                    {supplier.location}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">On-Time Delivery</span>
                  <span className="text-sm font-medium text-foreground">{supplier.onTimeDeliveryRate}%</span>
                </div>
                {supplier.notes && (
                  <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-3">
                    <span className="text-xs text-muted-foreground">Notes</span>
                    <span className="text-sm text-foreground">{supplier.notes}</span>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="materials" className="mt-4">
              {materials.length === 0 ? (
                <EmptyState icon={PackageX} title="No materials linked yet" description="Materials sourced from this supplier will appear here." />
              ) : (
                <div className="flex flex-col gap-3">
                  {materials.map((material) => (
                    <Card
                      key={material.id}
                      className="flex cursor-pointer items-center justify-between p-4"
                      onClick={() => router.push(`/masters/materials/${material.id}`)}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{material.name}</span>
                        <span className="text-xs text-muted-foreground">{material.code}</span>
                      </div>
                      <StatusBadge label={activeStatusMeta[material.status].label} level={activeStatusMeta[material.status].level} hideIcon />
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="orders" className="mt-4">
              {purchaseOrders.length === 0 ? (
                <EmptyState icon={PackageX} title="No purchase orders yet" description="Purchase orders raised with this supplier will appear here." />
              ) : (
                <div className="flex flex-col gap-3">
                  {purchaseOrders.map((po) => {
                    const meta = purchaseOrderStatusMeta[po.status];
                    return (
                      <Card key={po.id} className="flex items-center justify-between p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{po.poNumber}</span>
                          <span className="text-xs text-muted-foreground">
                            {po.itemSummary} · {formatCurrency(po.totalValue)} · Expected {formatDate(po.expectedDate)}
                          </span>
                        </div>
                        <StatusBadge label={meta.label} level={meta.level} />
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        }
      />

      <SupplierFormSheet open={sheetOpen} onOpenChange={setSheetOpen} supplier={supplier} existingSuppliers={suppliers} />
    </div>
  );
}
