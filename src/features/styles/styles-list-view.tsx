"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Ruler as StyleIcon } from "lucide-react";
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
import { styleHooks } from "@/features/styles/service";
import { StyleFormSheet } from "@/features/styles/style-form-sheet";
import { mockProducts } from "@/mock-data";
import type { MasterStatus, Style } from "@/types";

type StatusFilter = MasterStatus | "all";

function productName(productId: string) {
  return mockProducts.find((p) => p.id === productId)?.name ?? "—";
}

export function StylesListView() {
  const router = useRouter();
  const { data: styles = [], isLoading } = styleHooks.useList();
  const setStatusMutation = styleHooks.useSetStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<Style | undefined>();

  const filtered = useMemo(() => {
    return styles
      .filter((s) => statusFilter === "all" || s.status === statusFilter)
      .filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return s.styleCode.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
      });
  }, [styles, search, statusFilter]);

  function openCreate() {
    setEditingStyle(undefined);
    setSheetOpen(true);
  }

  function openEdit(style: Style) {
    setEditingStyle(style);
    setSheetOpen(true);
  }

  async function handleToggleStatus(style: Style) {
    const next: MasterStatus = style.status === "active" ? "inactive" : "active";
    await setStatusMutation.mutateAsync({ id: style.id, status: next });
    toast.success(`${style.name} marked ${next}`);
  }

  const columns: MasterDataColumn<Style>[] = [
    { key: "styleCode", header: "Style Code", render: (s) => <span className="font-medium text-foreground">{s.styleCode}</span> },
    { key: "name", header: "Name", render: (s) => s.name },
    { key: "product", header: "Product", render: (s) => productName(s.productId) },
    { key: "fit", header: "Fit", render: (s) => s.fit },
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
        <RowActionsMenu
          status={s.status}
          onView={() => router.push(`/masters/styles/${s.id}`)}
          onEdit={() => openEdit(s)}
          onToggleStatus={() => handleToggleStatus(s)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Styles"
        description="Fit, fabric and default operations for each product line"
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add Style
          </Button>
        }
      />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search styles…">
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
        <EmptyState
          icon={StyleIcon}
          title="No styles match your filters"
          description="Try a different search term or status, or add a new style."
        />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} onRowClick={(s) => router.push(`/masters/styles/${s.id}`)} />
          <MasterDataCards
            rows={filtered}
            renderCard={(s) => (
              <Card className="flex items-center justify-between p-4" onClick={() => router.push(`/masters/styles/${s.id}`)}>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.styleCode} · {s.fit} · {productName(s.productId)}
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

      <StyleFormSheet open={sheetOpen} onOpenChange={setSheetOpen} style={editingStyle} existingStyles={styles} />
    </div>
  );
}
