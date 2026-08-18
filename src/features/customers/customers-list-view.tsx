"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building, Plus, Users } from "lucide-react";
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
import { customerHooks } from "@/features/customers/service";
import { CustomerFormSheet } from "@/features/customers/customer-form-sheet";
import type { Customer, CustomerType, MasterStatus } from "@/types";

type StatusFilter = MasterStatus | "all";
type TypeFilter = CustomerType | "all";

const typeLabels: Record<CustomerType, string> = {
  brand: "Brand",
  retailer: "Retailer",
  wholesaler: "Wholesaler",
  individual: "Individual",
};

export function CustomersListView() {
  const router = useRouter();
  const { data: customers = [], isLoading } = customerHooks.useList();
  const setStatusMutation = customerHooks.useSetStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();

  const activeCount = customers.filter((c) => c.status === "active").length;
  const totalActiveOrders = customers.reduce((sum, c) => sum + c.activeOrders, 0);

  const filtered = useMemo(() => {
    return customers
      .filter((c) => statusFilter === "all" || c.status === statusFilter)
      .filter((c) => typeFilter === "all" || c.type === typeFilter)
      .filter((c) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.contactPerson.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q)
        );
      });
  }, [customers, search, statusFilter, typeFilter]);

  function openCreate() {
    setEditingCustomer(undefined);
    setSheetOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditingCustomer(customer);
    setSheetOpen(true);
  }

  async function handleToggleStatus(customer: Customer) {
    const next: MasterStatus = customer.status === "active" ? "inactive" : "active";
    await setStatusMutation.mutateAsync({ id: customer.id, status: next });
    toast.success(`${customer.name} marked ${next}`);
  }

  const columns: MasterDataColumn<Customer>[] = [
    { key: "code", header: "Code", render: (c) => <span className="font-medium text-foreground">{c.code}</span> },
    { key: "name", header: "Customer", render: (c) => c.name },
    { key: "type", header: "Type", render: (c) => typeLabels[c.type] },
    { key: "location", header: "Location", render: (c) => c.location },
    { key: "activeOrders", header: "Active Orders", align: "right", render: (c) => c.activeOrders },
    {
      key: "status",
      header: "Status",
      render: (c) => <StatusBadge label={activeStatusMeta[c.status].label} level={activeStatusMeta[c.status].level} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => (
        <RowActionsMenu
          status={c.status}
          onView={() => router.push(`/masters/customers/${c.id}`)}
          onEdit={() => openEdit(c)}
          onToggleStatus={() => handleToggleStatus(c)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Customers"
        description="Brands, retailers, wholesalers and business customers you manufacture for"
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add Customer
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Customers" value={customers.length.toString()} icon={Building} />
        <StatCard label="Active Customers" value={activeCount.toString()} icon={Building} accent="success" />
        <StatCard label="Active Orders" value={totalActiveOrders.toString()} icon={Users} accent="info" />
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by name, code, contact…">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
          <SelectTrigger className="w-full sm:w-40">
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
          icon={Building}
          title="No customers match your filters"
          description="Try a different search term, type or status, or add a new customer."
        />
      ) : (
        <>
          <MasterDataTable columns={columns} rows={filtered} onRowClick={(c) => router.push(`/masters/customers/${c.id}`)} />
          <MasterDataCards
            rows={filtered}
            renderCard={(c) => (
              <Card className="flex flex-col gap-2 p-4" onClick={() => router.push(`/masters/customers/${c.id}`)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{c.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.code} · {typeLabels[c.type]}
                    </span>
                  </div>
                  <StatusBadge label={activeStatusMeta[c.status].label} level={activeStatusMeta[c.status].level} hideIcon />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.location}</span>
                  <span>{c.activeOrders} active orders</span>
                </div>
                <div className="flex justify-end">
                  <RowActionsMenu status={c.status} onEdit={() => openEdit(c)} onToggleStatus={() => handleToggleStatus(c)} />
                </div>
              </Card>
            )}
          />
        </>
      )}

      <CustomerFormSheet open={sheetOpen} onOpenChange={setSheetOpen} customer={editingCustomer} existingCustomers={customers} />
    </div>
  );
}
