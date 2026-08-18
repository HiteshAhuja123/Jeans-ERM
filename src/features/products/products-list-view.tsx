"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Shirt } from "lucide-react";
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
import { productHooks } from "@/features/products/service";
import { ProductFormSheet } from "@/features/products/product-form-sheet";
import type { MasterStatus, Product } from "@/types";

type StatusFilter = MasterStatus | "all";

export function ProductsListView() {
  const router = useRouter();
  const { data: products = [], isLoading } = productHooks.useList();
  const setStatusMutation = productHooks.useSetStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  const filtered = useMemo(() => {
    return products
      .filter((p) => statusFilter === "all" || p.status === statusFilter)
      .filter((p) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
      });
  }, [products, search, statusFilter]);

  function openCreate() {
    setEditingProduct(undefined);
    setSheetOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setSheetOpen(true);
  }

  async function handleToggleStatus(product: Product) {
    const next: MasterStatus = product.status === "active" ? "inactive" : "active";
    await setStatusMutation.mutateAsync({ id: product.id, status: next });
    toast.success(`${product.name} marked ${next}`);
  }

  const columns: MasterDataColumn<Product>[] = [
    { key: "code", header: "Code", render: (p) => <span className="font-medium text-foreground">{p.code}</span> },
    { key: "name", header: "Name", render: (p) => p.name },
    { key: "category", header: "Category", render: (p) => p.category },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusBadge label={activeStatusMeta[p.status].label} level={activeStatusMeta[p.status].level} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => (
        <RowActionsMenu
          status={p.status}
          onView={() => router.push(`/masters/products/${p.id}`)}
          onEdit={() => openEdit(p)}
          onToggleStatus={() => handleToggleStatus(p)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Products"
        description="Finished jeans product lines — styles and SKUs sit underneath each product"
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add Product
          </Button>
        }
      />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search products…">
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
          icon={Shirt}
          title="No products match your filters"
          description="Try a different search term or status, or add a new product."
        />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} onRowClick={(p) => router.push(`/masters/products/${p.id}`)} />
          <MasterDataCards
            rows={filtered}
            renderCard={(p) => (
              <Card className="flex items-center justify-between p-4" onClick={() => router.push(`/masters/products/${p.id}`)}>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.code} · {p.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={activeStatusMeta[p.status].label} level={activeStatusMeta[p.status].level} hideIcon />
                  <RowActionsMenu status={p.status} onEdit={() => openEdit(p)} onToggleStatus={() => handleToggleStatus(p)} />
                </div>
              </Card>
            )}
          />
        </>
      )}

      <ProductFormSheet open={sheetOpen} onOpenChange={setSheetOpen} product={editingProduct} existingProducts={products} />
    </div>
  );
}
