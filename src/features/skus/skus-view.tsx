"use client";

import { useMemo, useState } from "react";
import { Plus, Tags } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import { MasterDataTable, type MasterDataColumn } from "@/components/shared/master-data-table";
import { MasterDataCards } from "@/components/shared/master-data-cards";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { activeStatusMeta } from "@/lib/status";
import { skuHooks } from "@/features/skus/service";
import { SkuFormSheet } from "@/features/skus/sku-form-sheet";
import { mockColors, mockSizes, mockStyles } from "@/mock-data";
import type { MasterStatus, Sku } from "@/types";

type StatusFilter = MasterStatus | "all";

function styleCode(styleId: string) {
  return mockStyles.find((s) => s.id === styleId)?.styleCode ?? "—";
}
function colorName(colorId: string) {
  return mockColors.find((c) => c.id === colorId)?.name ?? "—";
}
function sizeName(sizeId: string) {
  return mockSizes.find((s) => s.id === sizeId)?.displayName ?? "—";
}

export function SkusView() {
  const { data: skus = [], isLoading } = skuHooks.useList();
  const setStatusMutation = skuHooks.useSetStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingSku, setEditingSku] = useState<Sku | undefined>();

  const filtered = useMemo(() => {
    return skus
      .filter((s) => statusFilter === "all" || s.status === statusFilter)
      .filter((s) => (search ? s.skuCode.toLowerCase().includes(search.toLowerCase()) : true));
  }, [skus, search, statusFilter]);

  function openCreate() {
    setEditingSku(undefined);
    setSheetOpen(true);
  }

  function openEdit(sku: Sku) {
    setEditingSku(sku);
    setSheetOpen(true);
  }

  async function handleToggleStatus(sku: Sku) {
    const next: MasterStatus = sku.status === "active" ? "inactive" : "active";
    await setStatusMutation.mutateAsync({ id: sku.id, status: next });
    toast.success(`${sku.skuCode} marked ${next}`);
  }

  const columns: MasterDataColumn<Sku>[] = [
    { key: "skuCode", header: "SKU Code", render: (s) => <span className="font-medium text-foreground">{s.skuCode}</span> },
    { key: "style", header: "Style", render: (s) => styleCode(s.styleId) },
    { key: "color", header: "Color", render: (s) => colorName(s.colorId) },
    { key: "size", header: "Size", render: (s) => sizeName(s.sizeId) },
    {
      key: "status",
      header: "Status",
      render: (s) => <StatusBadge label={activeStatusMeta[s.status].label} level={activeStatusMeta[s.status].level} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <RowActionsMenu status={s.status} onEdit={() => openEdit(s)} onToggleStatus={() => handleToggleStatus(s)} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="SKUs"
        description="Style + Color + Size combinations — each must be unique"
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add SKU
          </Button>
        }
      />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search SKU code…">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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
        <EmptyState icon={Tags} title="No SKUs match your filters" description="Try a different search term or status, or add a new SKU." />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} />
          <MasterDataCards
            rows={filtered}
            renderCard={(s) => (
              <Card className="flex items-center justify-between p-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{s.skuCode}</span>
                  <span className="text-xs text-muted-foreground">
                    {colorName(s.colorId)} · Size {sizeName(s.sizeId)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={activeStatusMeta[s.status].label} level={activeStatusMeta[s.status].level} hideIcon />
                  <RowActionsMenu status={s.status} onEdit={() => openEdit(s)} onToggleStatus={() => handleToggleStatus(s)} />
                </div>
              </Card>
            )}
          />
        </>
      )}

      <SkuFormSheet open={sheetOpen} onOpenChange={setSheetOpen} sku={editingSku} existingSkus={skus} />
    </div>
  );
}
