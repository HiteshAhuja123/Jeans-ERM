"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Star, Truck } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import { MasterDataTable, type MasterDataColumn } from "@/components/shared/master-data-table";
import { MasterDataCards } from "@/components/shared/master-data-cards";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { activeStatusMeta } from "@/lib/status";
import { supplierHooks } from "@/features/suppliers/service";
import { SupplierFormSheet } from "@/features/suppliers/supplier-form-sheet";
import type { MasterStatus, Supplier, SupplierType } from "@/types";

type StatusFilter = MasterStatus | "all";
type TypeFilter = SupplierType | "all";

const typeLabels: Record<SupplierType, string> = {
  fabric: "Fabric",
  accessories: "Accessories",
  packaging: "Packaging",
  washing_vendor: "Washing Vendor",
  processing_vendor: "Processing Vendor",
  other: "Other",
};

export function SuppliersListView() {
  const router = useRouter();
  const { data: suppliers = [], isLoading } = supplierHooks.useList();
  const setStatusMutation = supplierHooks.useSetStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>();

  const activeCount = suppliers.filter((s) => s.status === "active").length;
  const avgOnTime = suppliers.length
    ? Math.round(suppliers.reduce((sum, s) => sum + s.onTimeDeliveryRate, 0) / suppliers.length)
    : 0;

  const filtered = useMemo(() => {
    return suppliers
      .filter((s) => statusFilter === "all" || s.status === statusFilter)
      .filter((s) => typeFilter === "all" || s.type === typeFilter)
      .filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.location.toLowerCase().includes(q);
      });
  }, [suppliers, search, statusFilter, typeFilter]);

  function openCreate() {
    setEditingSupplier(undefined);
    setSheetOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    setSheetOpen(true);
  }

  async function handleToggleStatus(supplier: Supplier) {
    const next: MasterStatus = supplier.status === "active" ? "inactive" : "active";
    await setStatusMutation.mutateAsync({ id: supplier.id, status: next });
    toast.success(`${supplier.name} marked ${next}`);
  }

  const columns: MasterDataColumn<Supplier>[] = [
    { key: "code", header: "Code", render: (s) => <span className="font-medium text-foreground">{s.code}</span> },
    { key: "name", header: "Supplier", render: (s) => s.name },
    { key: "type", header: "Type", render: (s) => typeLabels[s.type] },
    { key: "location", header: "Location", render: (s) => s.location },
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
          onView={() => router.push(`/masters/suppliers/${s.id}`)}
          onEdit={() => openEdit(s)}
          onToggleStatus={() => handleToggleStatus(s)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Suppliers"
        description="Fabric, accessories, packaging and processing vendors"
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add Supplier
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Suppliers" value={suppliers.length.toString()} icon={Truck} />
        <StatCard label="Active Suppliers" value={activeCount.toString()} icon={Truck} accent="success" />
        <StatCard label="Avg. On-Time Delivery" value={`${avgOnTime}%`} icon={Star} accent={avgOnTime >= 90 ? "success" : "warning"} />
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by name, code, location…">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(typeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          icon={Truck}
          title="No suppliers match your filters"
          description="Try a different search term, type or status, or add a new supplier."
        />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} onRowClick={(s) => router.push(`/masters/suppliers/${s.id}`)} />
          <MasterDataCards
            rows={filtered}
            renderCard={(s) => (
              <Card className="flex flex-col gap-2 p-4" onClick={() => router.push(`/masters/suppliers/${s.id}`)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{s.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {s.code} · {typeLabels[s.type]}
                    </span>
                  </div>
                  <StatusBadge label={activeStatusMeta[s.status].label} level={activeStatusMeta[s.status].level} hideIcon />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{s.location}</span>
                  <span className="flex items-center gap-1">
                    <Star className="size-3.5 fill-warning text-warning" />
                    {s.rating.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-end">
                  <RowActionsMenu status={s.status} onEdit={() => openEdit(s)} onToggleStatus={() => handleToggleStatus(s)} />
                </div>
              </Card>
            )}
          />
        </>
      )}

      <SupplierFormSheet open={sheetOpen} onOpenChange={setSheetOpen} supplier={editingSupplier} existingSuppliers={suppliers} />
    </div>
  );
}
