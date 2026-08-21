"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, FileText, PackageX } from "lucide-react";

import { DetailHeader } from "@/components/shared/detail-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LabeledProgress } from "@/components/shared/labeled-progress";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";
import { processingOrderStatusMeta } from "@/lib/status";
import { getProcessingQuantitySummary } from "@/lib/post-sewing-utils";
import { RecordProcessingReceiptDialog } from "@/features/processing/record-receipt-dialog";
import { SendProcessingDialog } from "@/features/processing/send-processing-dialog";
import { StartInternalProcessingButton } from "@/features/processing/start-internal-processing-button";
import { ProcessingOrderHoldControls } from "@/features/processing/hold-controls";
import { ProcessingOrderStatusMenu } from "@/features/processing/processing-order-status-menu";
import { processingOrderHooks, processingTransactionHooks } from "@/features/processing/service";
import { buildProcessingOrderActivity } from "@/mock-data/processing-activity";

export function ProcessingOrderDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: order, isLoading } = processingOrderHooks.useDetail(id);
  const { data: transactions = [] } = processingTransactionHooks.useByProcessingOrder(id);

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

  if (!order) {
    return (
      <EmptyState
        icon={PackageX}
        title="Processing order not found"
        description="This processing order may have been removed."
        action={{ label: "Back to Processing", onClick: () => router.push("/processing") }}
      />
    );
  }

  const statusMeta = processingOrderStatusMeta[order.status];
  const summary = getProcessingQuantitySummary(order, transactions);
  const activity = buildProcessingOrderActivity(order, transactions);

  const steps =
    order.mode === "outsourced"
      ? [
          { label: "Planned", value: summary.planned },
          { label: "Sent", value: summary.sent },
          { label: "Received", value: summary.received },
          { label: "Pending", value: summary.pending },
        ]
      : [
          { label: "Planned", value: summary.planned },
          { label: "Received", value: summary.received },
          { label: "Pending", value: summary.pending },
        ];

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/processing"
        backLabel="Back to Processing"
        title={order.processingOrderNumber}
        subtitle={`${order.sewingOrderNumber} · ${order.styleCode} · ${order.colorName} · ${order.quantity.toLocaleString()} pcs`}
        statusLabel={statusMeta.label}
        statusLevel={statusMeta.level}
        actions={
          <>
            <StartInternalProcessingButton processingOrder={order} />
            <SendProcessingDialog processingOrder={order} />
            <RecordProcessingReceiptDialog processingOrder={order} />
            <ProcessingOrderHoldControls processingOrder={order} />
            <ProcessingOrderStatusMenu processingOrder={order} />
          </>
        }
        tabs={
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
              <Card className="flex flex-col gap-4 p-5">
                <span className="text-sm font-semibold text-foreground">Processing Progress</span>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm">
                  {steps.map((step, index, arr) => (
                    <div key={step.label} className="flex items-center gap-2">
                      <div className="flex flex-col items-center rounded-lg border border-border bg-card px-3 py-2">
                        <span className="text-xs text-muted-foreground">{step.label}</span>
                        <span className="text-sm font-semibold text-foreground tabular-nums">{step.value.toLocaleString()}</span>
                      </div>
                      {index < arr.length - 1 && <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                    </div>
                  ))}
                </div>
                <LabeledProgress
                  label="Received vs. Planned"
                  current={summary.received}
                  total={summary.planned}
                  level={summary.received >= summary.planned ? "success" : "info"}
                />
              </Card>

              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Customer</span>
                  <span className="text-sm font-medium text-foreground">{order.customerName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Sewing Order</span>
                  <button type="button" onClick={() => router.push(`/sewing/orders/${order.sewingOrderId}`)} className="w-fit text-left text-sm font-medium text-primary hover:underline">
                    {order.sewingOrderNumber}
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Production Order</span>
                  <button type="button" onClick={() => router.push(`/production/orders/${order.productionOrderId}`)} className="w-fit text-left text-sm font-medium text-primary hover:underline">
                    {order.productionOrderNumber}
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Processing Type</span>
                  <span className="text-sm font-medium text-foreground">{order.processingTypeName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Mode</span>
                  <span className="text-sm font-medium text-foreground">{order.mode === "outsourced" ? `Outsourced — ${order.vendorName}` : "Internal"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Style / Color</span>
                  <span className="text-sm font-medium text-foreground">{order.styleCode} · {order.colorName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Planned Start / End</span>
                  <span className="text-sm font-medium text-foreground">
                    {order.plannedStart ? formatDate(order.plannedStart) : "—"} – {order.plannedEnd ? formatDate(order.plannedEnd) : "—"}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Actual Start / End</span>
                  <span className="text-sm font-medium text-foreground">
                    {order.actualStart ? formatDate(order.actualStart) : "—"} – {order.actualEnd ? formatDate(order.actualEnd) : "—"}
                  </span>
                </div>
                {order.holdReason && (
                  <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-3">
                    <span className="text-xs text-muted-foreground">Hold Reason</span>
                    <span className="text-sm text-warning">{order.holdReason}</span>
                  </div>
                )}
                {order.notes && (
                  <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-3">
                    <span className="text-xs text-muted-foreground">Notes</span>
                    <span className="text-sm text-foreground">{order.notes}</span>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="mt-4">
              {transactions.length === 0 ? (
                <EmptyState icon={FileText} title="No transactions recorded yet" description="Sent/received transactions will show up here." />
              ) : (
                <Card className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Recorded By</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...transactions]
                        .sort((a, b) => b.recordedDate.localeCompare(a.recordedDate))
                        .map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>{formatDate(tx.date)}</TableCell>
                            <TableCell className="font-medium text-foreground capitalize">{tx.type}</TableCell>
                            <TableCell className="text-right tabular-nums">{tx.quantity.toLocaleString()}</TableCell>
                            <TableCell>{tx.recordedBy}</TableCell>
                            <TableCell className="max-w-64 truncate text-muted-foreground">{tx.issueNotes ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <div className="flex flex-col gap-3">
                {activity.map((entry) => (
                  <Card key={entry.id} className="flex items-start justify-between gap-3 p-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">{entry.action}</span>
                      <span className="text-xs text-muted-foreground">{entry.actor}</span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(entry.timestamp)}</span>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        }
      />
    </div>
  );
}
