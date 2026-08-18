import { ClipboardList, ShoppingCart, Star, Truck } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { purchaseOrderStatusMeta, purchaseRequestStatusMeta } from "@/lib/status";
import { mockPurchaseOrders, mockPurchaseRequests, mockSuppliers } from "@/mock-data";

export function PurchasingView() {
  const openPOs = mockPurchaseOrders.filter((po) => po.status !== "received" && po.status !== "cancelled")
    .length;
  const pendingRequests = mockPurchaseRequests.filter((pr) => pr.status === "pending_approval").length;
  const totalPOValue = mockPurchaseOrders.reduce((sum, po) => sum + po.totalValue, 0);
  const avgOnTime = Math.round(
    mockSuppliers.reduce((sum, s) => sum + s.onTimeDeliveryRate, 0) / mockSuppliers.length,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Purchasing"
        description="Purchase requests, purchase orders and supplier performance"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open Purchase Orders" value={openPOs.toString()} icon={ShoppingCart} accent="info" />
        <StatCard
          label="Requests Awaiting Approval"
          value={pendingRequests.toString()}
          icon={ClipboardList}
          accent={pendingRequests > 0 ? "warning" : "success"}
        />
        <StatCard label="Open PO Value" value={formatCurrency(totalPOValue)} icon={ShoppingCart} />
        <StatCard
          label="Avg. Supplier On-Time"
          value={`${avgOnTime}%`}
          icon={Truck}
          accent={avgOnTime >= 90 ? "success" : "warning"}
        />
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="requests">Purchase Requests</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPurchaseOrders.map((po) => {
                  const meta = purchaseOrderStatusMeta[po.status];
                  return (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium text-foreground">{po.poNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{po.supplierName}</TableCell>
                      <TableCell className="text-foreground">{po.itemSummary}</TableCell>
                      <TableCell className="text-right text-foreground tabular-nums">
                        {formatCurrency(po.totalValue)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge label={meta.label} level={meta.level} />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(po.expectedDate)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
          <div className="flex flex-col gap-3 md:hidden">
            {mockPurchaseOrders.map((po) => {
              const meta = purchaseOrderStatusMeta[po.status];
              return (
                <Card key={po.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{po.poNumber}</span>
                      <span className="text-xs text-muted-foreground">{po.supplierName}</span>
                    </div>
                    <StatusBadge label={meta.label} level={meta.level} />
                  </div>
                  <p className="mt-2 text-sm text-foreground">{po.itemSummary}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{formatCurrency(po.totalValue)}</span>
                    <span>Expected {formatDate(po.expectedDate)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Needed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPurchaseRequests.map((pr) => {
                  const meta = purchaseRequestStatusMeta[pr.status];
                  return (
                    <TableRow key={pr.id}>
                      <TableCell className="font-medium text-foreground">{pr.requestNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{pr.requestedBy}</TableCell>
                      <TableCell className="text-foreground">{pr.itemSummary}</TableCell>
                      <TableCell className="text-right text-foreground tabular-nums">
                        {pr.quantity.toLocaleString()} {pr.unit}
                      </TableCell>
                      <TableCell>
                        <StatusBadge label={meta.label} level={meta.level} />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(pr.neededBy)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
          <div className="flex flex-col gap-3 md:hidden">
            {mockPurchaseRequests.map((pr) => {
              const meta = purchaseRequestStatusMeta[pr.status];
              return (
                <Card key={pr.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{pr.requestNumber}</span>
                      <span className="text-xs text-muted-foreground">{pr.requestedBy}</span>
                    </div>
                    <StatusBadge label={meta.label} level={meta.level} />
                  </div>
                  <p className="mt-2 text-sm text-foreground">
                    {pr.itemSummary} · {pr.quantity.toLocaleString()} {pr.unit}
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">Needed by {formatDate(pr.neededBy)}</div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="suppliers">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {mockSuppliers.map((supplier) => (
              <Card key={supplier.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{supplier.name}</span>
                    <span className="text-xs text-muted-foreground">{supplier.location}</span>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                    <Star className="size-3.5 fill-warning text-warning" />
                    {supplier.rating.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{supplier.activeOrders} active orders</span>
                  <span>{supplier.onTimeDeliveryRate}% on-time</span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
