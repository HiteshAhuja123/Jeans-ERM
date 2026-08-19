"use client";

import { useRouter } from "next/navigation";
import { ClipboardX } from "lucide-react";

import { DetailHeader } from "@/components/shared/detail-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { purchaseRequestPriorityMeta, purchaseRequestStatusMeta } from "@/lib/status";
import { purchaseRequestHooks } from "@/features/purchasing/service";
import { PurchaseRequestStatusMenu } from "@/features/purchasing/purchase-request-status-menu";
import { supplierHooks } from "@/features/suppliers/service";

export function PurchaseRequestDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: request, isLoading } = purchaseRequestHooks.useDetail(id);
  const { data: suppliers = [] } = supplierHooks.useList();

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

  if (!request) {
    return (
      <EmptyState
        icon={ClipboardX}
        title="Purchase request not found"
        description="This request may have been removed."
        action={{ label: "Back to Purchasing", onClick: () => router.push("/purchasing") }}
      />
    );
  }

  const statusMeta = purchaseRequestStatusMeta[request.status];
  const priorityMeta = purchaseRequestPriorityMeta[request.priority];
  const preferredSupplier = suppliers.find((s) => s.id === request.preferredSupplierId);

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/purchasing"
        backLabel="Back to Purchasing"
        title={request.requestNumber}
        subtitle={`${request.materialName} · ${request.quantity.toLocaleString()} ${request.unit}`}
        statusLabel={statusMeta.label}
        statusLevel={statusMeta.level}
        actions={
          <>
            {request.status === "approved" && (
              <Button onClick={() => router.push(`/purchasing/orders/new?fromRequest=${request.id}`)}>
                Convert to Purchase Order
              </Button>
            )}
            <PurchaseRequestStatusMenu request={request} />
          </>
        }
      />

      <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Requested By</span>
          <span className="text-sm font-medium text-foreground">{request.requestedBy}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Request Date</span>
          <span className="text-sm font-medium text-foreground">{formatDate(request.requestDate)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Required By</span>
          <span className="text-sm font-medium text-foreground">{formatDate(request.requiredDate)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Material</span>
          <span className="text-sm font-medium text-foreground">
            {request.materialCode} — {request.materialName}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Quantity</span>
          <span className="text-sm font-medium text-foreground">
            {request.quantity.toLocaleString()} {request.unit}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Priority</span>
          <span className="text-sm font-medium text-foreground">{priorityMeta.label}</span>
        </div>
        {preferredSupplier && (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Preferred Supplier</span>
            <span className="text-sm font-medium text-foreground">{preferredSupplier.name}</span>
          </div>
        )}
        <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-3">
          <span className="text-xs text-muted-foreground">Reason</span>
          <span className="text-sm text-foreground">{request.reason}</span>
        </div>
        {request.notes && (
          <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-3">
            <span className="text-xs text-muted-foreground">Notes</span>
            <span className="text-sm text-foreground">{request.notes}</span>
          </div>
        )}
      </Card>
    </div>
  );
}
