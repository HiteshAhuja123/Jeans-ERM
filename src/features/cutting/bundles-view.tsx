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
import { formatDate } from "@/lib/format";
import { bundleStatusMeta } from "@/lib/status";
import { bundleActionHooks, bundleHooks } from "@/features/cutting/bundle-service";
import { mockSizes } from "@/mock-data";
import { currentUser } from "@/mock-data/users";
import type { Bundle, BundleStatus } from "@/types";

type StatusFilter = BundleStatus | "all";

const verifiableStatuses: BundleStatus[] = ["created", "pending_verification"];

export function BundlesView() {
  const router = useRouter();
  const { data: bundles = [], isLoading } = bundleHooks.useList();
  const verifyMutation = bundleActionHooks.useVerify();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");

  const sizesPresent = useMemo(() => {
    const ids = new Set(bundles.flatMap((b) => b.items.map((i) => i.sizeId)));
    return mockSizes.filter((s) => ids.has(s.id)).sort((a, b) => a.sequence - b.sequence);
  }, [bundles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bundles
      .filter((b) =>
        q
          ? b.bundleNumber.toLowerCase().includes(q) ||
            b.productionOrderNumber.toLowerCase().includes(q) ||
            b.styleCode.toLowerCase().includes(q) ||
            b.colorName.toLowerCase().includes(q) ||
            (b.skuId ?? "").toLowerCase().includes(q)
          : true,
      )
      .filter((b) => statusFilter === "all" || b.status === statusFilter)
      .filter((b) => sizeFilter === "all" || b.items.some((i) => i.sizeId === sizeFilter))
      .sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  }, [bundles, search, statusFilter, sizeFilter]);

  async function handleVerify(bundle: Bundle) {
    try {
      await verifyMutation.mutateAsync({ bundle, verifiedBy: currentUser.name });
      toast.success(`${bundle.bundleNumber} verified — Ready for Sewing`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  const columns: MasterDataColumn<Bundle>[] = [
    { key: "bundleNumber", header: "Bundle", render: (b) => <span className="font-medium text-foreground">{b.bundleNumber}</span> },
    { key: "prodOrder", header: "Production Order", render: (b) => b.productionOrderNumber },
    { key: "style", header: "Style", render: (b) => `${b.styleCode} · ${b.colorName}` },
    { key: "size", header: "Size", render: (b) => b.items.map((i) => i.sizeCode).join(", ") },
    { key: "qty", header: "Qty", align: "right", render: (b) => `${b.quantity.toLocaleString()} pcs` },
    {
      key: "status",
      header: "Status",
      render: (b) => {
        const meta = bundleStatusMeta[b.status];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
    { key: "created", header: "Created", align: "right", render: (b) => formatDate(b.createdDate) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Bundles" description="Cut, bundled pieces ready to move to sewing" />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search bundle, production order, style, SKU or color…">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(bundleStatusMeta).map(([value, meta]) => (
              <SelectItem key={value} value={value}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sizeFilter} onValueChange={setSizeFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sizes</SelectItem>
            {sizesPresent.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.code}
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
        <EmptyState icon={Layers} title="No bundles match your filters" description="Try a different search term, status or size." />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} onRowClick={(b) => router.push(`/cutting/bundles/${b.id}`)} />
          <MasterDataCards
            rows={filtered}
            renderCard={(bundle) => {
              const meta = bundleStatusMeta[bundle.status];
              return (
                <Card key={bundle.id} className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2" onClick={() => router.push(`/cutting/bundles/${bundle.id}`)} role="button" tabIndex={0}>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{bundle.bundleNumber}</span>
                      <span className="text-xs text-muted-foreground">{bundle.styleCode} · {bundle.colorName}</span>
                    </div>
                    <StatusBadge label={meta.label} level={meta.level} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">Size {bundle.items.map((i) => i.sizeCode).join(", ")}</span>
                    <span className="font-medium text-foreground">{bundle.quantity.toLocaleString()} pcs</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {verifiableStatuses.includes(bundle.status) && (
                      <Button size="sm" onClick={() => handleVerify(bundle)} disabled={verifyMutation.isPending}>
                        Verify
                      </Button>
                    )}
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
    </div>
  );
}
