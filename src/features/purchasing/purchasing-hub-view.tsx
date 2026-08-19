"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, Plus, ShoppingCart } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MasterDataTable, type MasterDataColumn } from "@/components/shared/master-data-table";
import { MasterDataCards } from "@/components/shared/master-data-cards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import { purchaseOrderStatusMeta, purchaseRequestPriorityMeta, purchaseRequestStatusMeta } from "@/lib/status";
import { purchaseOrderHooks, purchaseRequestHooks } from "@/features/purchasing/service";
import { PurchaseRequestFormSheet } from "@/features/purchasing/purchase-request-form-sheet";
import { supplierHooks } from "@/features/suppliers/service";
import type { PurchaseOrder, PurchaseOrderStatus, PurchaseRequest, PurchaseRequestStatus } from "@/types";

type PoStatusFilter = PurchaseOrderStatus | "all";
type PrStatusFilter = PurchaseRequestStatus | "all";

function poItemSummary(po: PurchaseOrder): string {
  if (po.items.length === 0) return "No items";
  if (po.items.length === 1) return po.items[0].materialName;
  return `${po.items[0].materialName} + ${po.items.length - 1} more`;
}

export function PurchasingHubView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: purchaseOrders = [], isLoading: poLoading } = purchaseOrderHooks.useList();
  const { data: purchaseRequests = [], isLoading: prLoading } = purchaseRequestHooks.useList();
  const { data: suppliers = [] } = supplierHooks.useList();

  const [tab, setTab] = useState<"orders" | "requests">("orders");
  const [poSearch, setPoSearch] = useState("");
  const [poStatusFilter, setPoStatusFilter] = useState<PoStatusFilter>("all");
  const [prSearch, setPrSearch] = useState("");
  const [prStatusFilter, setPrStatusFilter] = useState<PrStatusFilter>("all");

  const prefillMaterialId = searchParams.get("newRequest");
  const [prSheetOpen, setPrSheetOpen] = useState(Boolean(prefillMaterialId));

  const filteredPos = useMemo(() => {
    const q = poSearch.trim().toLowerCase();
    return purchaseOrders
      .filter((po) => (q ? po.poNumber.toLowerCase().includes(q) || po.supplierName.toLowerCase().includes(q) : true))
      .filter((po) => poStatusFilter === "all" || po.status === poStatusFilter)
      .sort((a, b) => b.orderDate.localeCompare(a.orderDate));
  }, [purchaseOrders, poSearch, poStatusFilter]);

  const filteredPrs = useMemo(() => {
    const q = prSearch.trim().toLowerCase();
    return purchaseRequests
      .filter((pr) => (q ? pr.requestNumber.toLowerCase().includes(q) || pr.materialName.toLowerCase().includes(q) : true))
      .filter((pr) => prStatusFilter === "all" || pr.status === prStatusFilter)
      .sort((a, b) => b.requestDate.localeCompare(a.requestDate));
  }, [purchaseRequests, prSearch, prStatusFilter]);

  const stats = useMemo(() => {
    const openPos = purchaseOrders.filter((po) => !["received", "cancelled"].includes(po.status)).length;
    const openValue = purchaseOrders
      .filter((po) => !["draft", "cancelled"].includes(po.status))
      .reduce((sum, po) => sum + po.totalValue, 0);
    const awaitingApproval = purchaseRequests.filter((pr) => pr.status === "submitted" || pr.status === "pending_approval").length;
    const avgOnTime = suppliers.length
      ? Math.round(suppliers.reduce((sum, s) => sum + s.onTimeDeliveryRate, 0) / suppliers.length)
      : 0;
    return { openPos, openValue, awaitingApproval, avgOnTime };
  }, [purchaseOrders, purchaseRequests, suppliers]);

  const poColumns: MasterDataColumn<PurchaseOrder>[] = [
    { key: "poNumber", header: "PO No.", render: (po) => <span className="font-medium text-foreground">{po.poNumber}</span> },
    { key: "supplier", header: "Supplier", render: (po) => po.supplierName },
    { key: "items", header: "Items", render: (po) => poItemSummary(po) },
    { key: "total", header: "Total", align: "right", render: (po) => formatCurrency(po.totalValue) },
    {
      key: "status",
      header: "Status",
      render: (po) => {
        const meta = purchaseOrderStatusMeta[po.status];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
    { key: "expected", header: "Expected", align: "right", render: (po) => formatDate(po.expectedDate) },
  ];

  const prColumns: MasterDataColumn<PurchaseRequest>[] = [
    { key: "requestNumber", header: "Request No.", render: (pr) => <span className="font-medium text-foreground">{pr.requestNumber}</span> },
    { key: "material", header: "Material", render: (pr) => pr.materialName },
    { key: "quantity", header: "Quantity", align: "right", render: (pr) => `${pr.quantity.toLocaleString()} ${pr.unit}` },
    { key: "requestedBy", header: "Requested By", render: (pr) => pr.requestedBy },
    {
      key: "priority",
      header: "Priority",
      render: (pr) => {
        const meta = purchaseRequestPriorityMeta[pr.priority];
        return <StatusBadge label={meta.label} level={meta.level} hideIcon />;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (pr) => {
        const meta = purchaseRequestStatusMeta[pr.status];
        return <StatusBadge label={meta.label} level={meta.level} />;
      },
    },
    { key: "requiredBy", header: "Required By", align: "right", render: (pr) => formatDate(pr.requiredDate) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Purchasing"
        description="Purchase requests, purchase orders and supplier activity"
        actions={
          <Button variant="outline" onClick={() => router.push("/masters/suppliers")}>
            View Suppliers
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open Purchase Orders" value={stats.openPos.toString()} icon={ShoppingCart} />
        <StatCard label="Requests Awaiting Approval" value={stats.awaitingApproval.toString()} icon={ClipboardList} accent={stats.awaitingApproval > 0 ? "warning" : "success"} />
        <StatCard label="Open PO Value" value={formatCurrency(stats.openValue)} icon={ShoppingCart} />
        <StatCard label="Avg. Supplier On-Time" value={`${stats.avgOnTime}%`} icon={ClipboardList} accent={stats.avgOnTime >= 90 ? "success" : "warning"} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "orders" | "requests")}>
        <TabsList>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="requests">Purchase Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4 flex flex-col gap-4">
          <FilterBar searchValue={poSearch} onSearchChange={setPoSearch} searchPlaceholder="Search by PO number or supplier…">
            <Select value={poStatusFilter} onValueChange={(v) => setPoStatusFilter(v as PoStatusFilter)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(purchaseOrderStatusMeta).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => router.push("/purchasing/orders/new")}>
              <Plus /> New Purchase Order
            </Button>
          </FilterBar>

          {poLoading ? (
            <Card className="flex flex-col gap-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </Card>
          ) : filteredPos.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="No purchase orders match your filters" description="Try a different search term or status." />
          ) : (
            <>
              <MasterDataTable columns={poColumns} rows={filteredPos} onRowClick={(po) => router.push(`/purchasing/orders/${po.id}`)} />
              <MasterDataCards
                rows={filteredPos}
                renderCard={(po) => {
                  const meta = purchaseOrderStatusMeta[po.status];
                  return (
                    <Card className="flex flex-col gap-2 p-4" onClick={() => router.push(`/purchasing/orders/${po.id}`)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{po.poNumber}</span>
                          <span className="text-xs text-muted-foreground">{po.supplierName}</span>
                        </div>
                        <StatusBadge label={meta.label} level={meta.level} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{poItemSummary(po)}</span>
                        <span className="font-medium text-foreground">{formatCurrency(po.totalValue)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Expected {formatDate(po.expectedDate)}</span>
                    </Card>
                  );
                }}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-4 flex flex-col gap-4">
          <FilterBar searchValue={prSearch} onSearchChange={setPrSearch} searchPlaceholder="Search by request number or material…">
            <Select value={prStatusFilter} onValueChange={(v) => setPrStatusFilter(v as PrStatusFilter)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(purchaseRequestStatusMeta).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setPrSheetOpen(true)}>
              <Plus /> New Request
            </Button>
          </FilterBar>

          {prLoading ? (
            <Card className="flex flex-col gap-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </Card>
          ) : filteredPrs.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No purchase requests match your filters" description="Try a different search term or status." />
          ) : (
            <>
              <MasterDataTable columns={prColumns} rows={filteredPrs} onRowClick={(pr) => router.push(`/purchasing/requests/${pr.id}`)} />
              <MasterDataCards
                rows={filteredPrs}
                renderCard={(pr) => {
                  const meta = purchaseRequestStatusMeta[pr.status];
                  return (
                    <Card className="flex flex-col gap-2 p-4" onClick={() => router.push(`/purchasing/requests/${pr.id}`)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{pr.requestNumber}</span>
                          <span className="text-xs text-muted-foreground">{pr.materialName}</span>
                        </div>
                        <StatusBadge label={meta.label} level={meta.level} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">
                          {pr.quantity.toLocaleString()} {pr.unit}
                        </span>
                        <span className="text-xs text-muted-foreground">Required {formatDate(pr.requiredDate)}</span>
                      </div>
                    </Card>
                  );
                }}
              />
            </>
          )}
        </TabsContent>
      </Tabs>

      <PurchaseRequestFormSheet
        open={prSheetOpen}
        onOpenChange={setPrSheetOpen}
        prefill={
          prefillMaterialId
            ? { materialId: prefillMaterialId, quantity: Number(searchParams.get("qty")) || undefined }
            : undefined
        }
      />
    </div>
  );
}
