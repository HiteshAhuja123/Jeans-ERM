"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MasterDataTable, type MasterDataColumn } from "@/components/shared/master-data-table";
import { MasterDataCards } from "@/components/shared/master-data-cards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bundleStatusMeta } from "@/lib/status";
import { bundleHooks } from "@/features/cutting/bundle-service";
import { sewingOrderBundleHooks, sewingOrderHooks } from "@/features/sewing/service";
import { StartSewingButton } from "@/features/sewing/start-sewing-button";
import { RecordProductionDialog } from "@/features/sewing/record-production-dialog";
import type { Bundle, BundleStatus, SewingOrder } from "@/types";

type StatusFilter = BundleStatus | "all";

const sewingQueueStatuses: BundleStatus[] = ["ready_for_sewing", "assigned", "in_sewing", "partially_completed", "on_hold", "completed"];

export function SewingBundleQueueView() {
  const router = useRouter();
  const { data: bundles = [], isLoading } = bundleHooks.useList();
  const { data: sewingOrderBundles = [] } = sewingOrderBundleHooks.useList();
  const { data: sewingOrders = [] } = sewingOrderHooks.useList();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [recordFor, setRecordFor] = useState<{ bundle: Bundle; sewingOrder: SewingOrder } | null>(null);

  function ownerOf(bundleId: string): SewingOrder | undefined {
    const link = sewingOrderBundles.find((l) => l.bundleId === bundleId);
    return link ? sewingOrders.find((o) => o.id === link.sewingOrderId) : undefined;
  }

  const queueBundles = useMemo(() => bundles.filter((b) => sewingQueueStatuses.includes(b.status)), [bundles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return queueBundles
      .filter((b) =>
        q
          ? b.bundleNumber.toLowerCase().includes(q) ||
            b.productionOrderNumber.toLowerCase().includes(q) ||
            b.styleCode.toLowerCase().includes(q) ||
            b.colorName.toLowerCase().includes(q)
          : true,
      )
      .filter((b) => statusFilter === "all" || b.status === statusFilter)
      .sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  }, [queueBundles, search, statusFilter]);

  function handleAssign(bundle: Bundle) {
    const owner = sewingOrders.find(
      (o) => o.productionOrderId === bundle.productionOrderId && ["planned", "assigned", "ready"].includes(o.status),
    );
    if (owner) {
      router.push(`/sewing/orders/${owner.id}`);
      return;
    }
    toast.info("No open sewing order yet for this production order — create one first.");
    router.push("/sewing/orders");
  }

  const columns: MasterDataColumn<Bundle>[] = [
    { key: "bundleNumber", header: "Bundle", render: (b) => <span className="font-medium text-foreground">{b.bundleNumber}</span> },
    { key: "prodOrder", header: "Production Order", render: (b) => b.productionOrderNumber },
    { key: "style", header: "Style", render: (b) => `${b.styleCode} · ${b.colorName}` },
    { key: "size", header: "Size", render: (b) => b.items.map((i) => i.sizeCode).join(", ") },
    { key: "qty", header: "Qty", align: "right", render: (b) => `${b.quantity.toLocaleString()} pcs` },
    { key: "sewingOrder", header: "Sewing Order", render: (b) => ownerOf(b.id)?.sewingOrderNumber ?? "—" },
    {
      key: "status",
      header: "Status",
      render: (b) => {
        const meta = bundleStatusMeta[b.status];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
  ];

  function actionsFor(bundle: Bundle) {
    const owner = ownerOf(bundle.id);
    if (bundle.status === "ready_for_sewing") {
      return (
        <Button size="sm" onClick={() => handleAssign(bundle)}>
          Assign
        </Button>
      );
    }
    if (bundle.status === "assigned" && owner) {
      return <StartSewingButton sewingOrder={owner} size="sm" />;
    }
    if (bundle.status === "in_sewing" && owner) {
      return (
        <Button size="sm" onClick={() => setRecordFor({ bundle, sewingOrder: owner })}>
          Record
        </Button>
      );
    }
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Sewing Work Queue" description="Bundles moving through sewing — ready, assigned, in progress or completed" />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search bundle, production order or style…">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {sewingQueueStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {bundleStatusMeta[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      {isLoading ? (
        <Card className="flex flex-col gap-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Layers} title="No bundles match your filters" description="Try a different search term or status." />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} onRowClick={(b) => router.push(`/cutting/bundles/${b.id}`)} />
          <MasterDataCards
            rows={filtered}
            renderCard={(bundle) => {
              const meta = bundleStatusMeta[bundle.status];
              const owner = ownerOf(bundle.id);
              return (
                <Card key={bundle.id} className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2" onClick={() => router.push(`/cutting/bundles/${bundle.id}`)} role="button" tabIndex={0}>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{bundle.bundleNumber}</span>
                      <span className="text-xs text-muted-foreground">
                        {bundle.styleCode} · {bundle.colorName}
                        {owner ? ` · ${owner.sewingOrderNumber}` : ""}
                      </span>
                    </div>
                    <StatusBadge label={meta.label} level={meta.level} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">Size {bundle.items.map((i) => i.sizeCode).join(", ")}</span>
                    <span className="font-medium text-foreground">{bundle.quantity.toLocaleString()} pcs</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {actionsFor(bundle)}
                    <Button size="sm" variant="outline" onClick={() => router.push(`/cutting/bundles/${bundle.id}`)}>
                      View
                    </Button>
                  </div>
                </Card>
              );
            }}
          />
        </>
      )}

      {recordFor && (
        <RecordProductionDialog
          open={Boolean(recordFor)}
          onOpenChange={(open) => !open && setRecordFor(null)}
          sewingOrder={recordFor.sewingOrder}
          bundle={recordFor.bundle}
        />
      )}
    </div>
  );
}
