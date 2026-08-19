"use client";

import { useRouter } from "next/navigation";
import { Check, PackageX } from "lucide-react";
import { toast } from "sonner";

import { DetailHeader } from "@/components/shared/detail-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { bundleStatusMeta } from "@/lib/status";
import { bundleActionHooks, bundleHooks } from "@/features/cutting/bundle-service";
import { BundleLabel } from "@/features/cutting/bundle-label";
import { BundleStatusMenu } from "@/features/cutting/bundle-status-menu";
import { cuttingOrderHooks } from "@/features/cutting/service";
import { mockSkus } from "@/mock-data";
import { currentUser } from "@/mock-data/users";
import type { BundleStatus } from "@/types";

const verifiableStatuses: BundleStatus[] = ["created", "pending_verification"];

export function BundleDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: bundle, isLoading } = bundleHooks.useDetail(id);
  const { data: cuttingOrder } = cuttingOrderHooks.useDetail(bundle?.cuttingOrderId);
  const verifyMutation = bundleActionHooks.useVerify();

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

  if (!bundle) {
    return (
      <EmptyState
        icon={PackageX}
        title="Bundle not found"
        description="This bundle may have been removed."
        action={{ label: "Back to Bundles", onClick: () => router.push("/cutting/bundles") }}
      />
    );
  }

  const statusMeta = bundleStatusMeta[bundle.status];
  const sku = mockSkus.find((s) => s.id === bundle.skuId);
  const canVerify = verifiableStatuses.includes(bundle.status);

  async function handleVerify() {
    if (!bundle) return;
    try {
      await verifyMutation.mutateAsync({ bundle, verifiedBy: currentUser.name });
      toast.success(`${bundle.bundleNumber} verified — Ready for Sewing`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  const checklist = [
    { label: "Style", value: bundle.styleCode },
    { label: "Color", value: bundle.colorName },
    { label: "Size", value: bundle.items.map((i) => i.sizeCode).join(", ") },
    { label: "Quantity", value: `${bundle.quantity.toLocaleString()} pcs` },
    { label: "Production Order", value: bundle.productionOrderNumber },
    { label: "Cutting Batch", value: bundle.cuttingBatchId },
    { label: "Bundle ID", value: bundle.bundleNumber },
  ];

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/cutting/bundles"
        backLabel="Back to Bundles"
        title={bundle.bundleNumber}
        subtitle={`${bundle.productionOrderNumber} · ${bundle.styleCode} · ${bundle.colorName} · ${bundle.quantity.toLocaleString()} pcs`}
        statusLabel={statusMeta.label}
        statusLevel={statusMeta.level}
        actions={
          <>
            {canVerify && (
              <Button onClick={handleVerify} disabled={verifyMutation.isPending}>
                <Check /> {verifyMutation.isPending ? "Verifying…" : "Verify"}
              </Button>
            )}
            <BundleStatusMenu bundle={bundle} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3 p-5">
            <span className="text-sm font-semibold text-foreground">Traceability</span>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <button type="button" onClick={() => router.push(`/masters/customers/${bundle.customerId}`)} className="rounded-full border border-border px-3 py-1 text-primary hover:underline">
                {bundle.customerName}
              </button>
              <span className="text-muted-foreground">›</span>
              <button type="button" onClick={() => router.push(`/orders/${bundle.orderId}`)} className="rounded-full border border-border px-3 py-1 text-primary hover:underline">
                {bundle.orderNumber}
              </button>
              <span className="text-muted-foreground">›</span>
              <button type="button" onClick={() => router.push(`/production/orders/${bundle.productionOrderId}`)} className="rounded-full border border-border px-3 py-1 text-primary hover:underline">
                {bundle.productionOrderNumber}
              </button>
              <span className="text-muted-foreground">›</span>
              <button type="button" onClick={() => router.push(`/cutting/orders/${bundle.cuttingOrderId}`)} className="rounded-full border border-border px-3 py-1 text-primary hover:underline">
                {cuttingOrder?.cuttingOrderNumber ?? "Cutting Order"}
              </button>
              <span className="text-muted-foreground">›</span>
              <span className="rounded-full border border-border px-3 py-1 text-foreground">{bundle.cuttingBatchId}</span>
              <span className="text-muted-foreground">›</span>
              <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-medium text-primary">{bundle.bundleNumber}</span>
            </div>
          </Card>

          <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Style</span>
              <span className="text-sm font-medium text-foreground">{bundle.styleCode}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">SKU</span>
              <span className="text-sm font-medium text-foreground">{sku?.skuCode ?? "—"}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Color</span>
              <span className="text-sm font-medium text-foreground">{bundle.colorName}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Size</span>
              <span className="text-sm font-medium text-foreground">{bundle.items.map((i) => i.sizeCode).join(", ")}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Quantity</span>
              <span className="text-sm font-medium text-foreground">{bundle.quantity.toLocaleString()} pcs</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Material</span>
              <span className="text-sm font-medium text-foreground">{bundle.materialName}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Created By</span>
              <span className="text-sm font-medium text-foreground">{bundle.createdBy}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Created Date</span>
              <span className="text-sm font-medium text-foreground">{formatDate(bundle.createdDate)}</span>
            </div>
            {bundle.verifiedBy && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Verified By</span>
                <span className="text-sm font-medium text-foreground">{bundle.verifiedBy} · {bundle.verifiedDate ? formatDate(bundle.verifiedDate) : ""}</span>
              </div>
            )}
          </Card>

          {canVerify && (
            <Card className="flex flex-col gap-2 p-5">
              <span className="text-sm font-semibold text-foreground">Verification Checklist</span>
              {checklist.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Check className="size-3.5 text-success" aria-hidden="true" /> {item.value}
                  </span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">All fields verified from the system record. Click Verify to mark this bundle Ready for Sewing.</p>
            </Card>
          )}

          <Card className="flex flex-col gap-1 p-5">
            <span className="text-sm font-semibold text-foreground">Sewing</span>
            <p className="text-sm text-muted-foreground">
              {bundle.status === "ready_for_sewing"
                ? "Ready and waiting to be picked up by sewing. Sewing execution is introduced in Phase 8."
                : "Not yet ready for sewing. Sewing execution is introduced in Phase 8."}
            </p>
          </Card>
        </div>

        <BundleLabel bundle={bundle} />
      </div>
    </div>
  );
}
