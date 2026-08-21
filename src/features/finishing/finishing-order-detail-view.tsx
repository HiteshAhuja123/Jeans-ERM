"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, PackageX } from "lucide-react";

import { DetailHeader } from "@/components/shared/detail-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LabeledProgress } from "@/components/shared/labeled-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";
import { finishingOrderStatusMeta } from "@/lib/status";
import { getFinishingOrderQuantitySummary } from "@/lib/post-sewing-utils";
import { RecordFinishingOutputDialog } from "@/features/finishing/record-output-dialog";
import { StartFinishingButton } from "@/features/finishing/start-finishing-button";
import { FinishingOrderHoldControls } from "@/features/finishing/hold-controls";
import { FinishingOrderStatusMenu } from "@/features/finishing/finishing-order-status-menu";
import { finishingEntryHooks, finishingOrderHooks } from "@/features/finishing/service";
import { mockFinishingIssueReasons } from "@/mock-data";
import { buildFinishingOrderActivity } from "@/mock-data/finishing-activity";

export function FinishingOrderDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: order, isLoading } = finishingOrderHooks.useDetail(id);
  const { data: entries = [] } = finishingEntryHooks.useByFinishingOrder(id);
  const [recordOpen, setRecordOpen] = useState(false);

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
        title="Finishing order not found"
        description="This finishing order may have been removed."
        action={{ label: "Back to Finishing", onClick: () => router.push("/finishing") }}
      />
    );
  }

  const statusMeta = finishingOrderStatusMeta[order.status];
  const summary = getFinishingOrderQuantitySummary(order, entries);
  const activity = buildFinishingOrderActivity(order, entries);
  const canRecord = (order.status === "in_progress" || order.status === "partially_completed") && summary.remaining > 0;

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/finishing"
        backLabel="Back to Finishing"
        title={order.finishingOrderNumber}
        subtitle={`${order.processingOrderNumber} · ${order.styleCode} · ${order.colorName} · ${order.quantity.toLocaleString()} pcs`}
        statusLabel={statusMeta.label}
        statusLevel={statusMeta.level}
        actions={
          <>
            <StartFinishingButton finishingOrder={order} />
            {canRecord && <Button onClick={() => setRecordOpen(true)}>Record Output</Button>}
            <FinishingOrderHoldControls finishingOrder={order} />
            <FinishingOrderStatusMenu finishingOrder={order} />
          </>
        }
        tabs={
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="output">Output</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
              <Card className="flex flex-col gap-4 p-5">
                <span className="text-sm font-semibold text-foreground">Finishing Progress</span>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm">
                  {[
                    { label: "Planned", value: summary.planned },
                    { label: "Processed", value: summary.processed },
                    { label: "Output", value: summary.output },
                    { label: "Issues", value: summary.issue },
                    { label: "Remaining", value: summary.remaining },
                  ].map((step, index, arr) => (
                    <div key={step.label} className="flex items-center gap-2">
                      <div className="flex flex-col items-center rounded-lg border border-border bg-card px-3 py-2">
                        <span className="text-xs text-muted-foreground">{step.label}</span>
                        <span className="text-sm font-semibold text-foreground tabular-nums">{step.value.toLocaleString()}</span>
                      </div>
                      {index < arr.length - 1 && <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                    </div>
                  ))}
                </div>
                <LabeledProgress label="Output vs. Planned" current={summary.output} total={order.quantity} level={summary.output >= order.quantity ? "success" : "info"} />
              </Card>

              <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Customer</span>
                  <span className="text-sm font-medium text-foreground">{order.customerName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Processing Order</span>
                  <button type="button" onClick={() => router.push(`/processing/${order.processingOrderId}`)} className="w-fit text-left text-sm font-medium text-primary hover:underline">
                    {order.processingOrderNumber}
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Production Order</span>
                  <button type="button" onClick={() => router.push(`/production/orders/${order.productionOrderId}`)} className="w-fit text-left text-sm font-medium text-primary hover:underline">
                    {order.productionOrderNumber}
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Style / Color</span>
                  <span className="text-sm font-medium text-foreground">{order.styleCode} · {order.colorName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Responsible</span>
                  <span className="text-sm font-medium text-foreground">{order.responsible ?? "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Planned Start / End</span>
                  <span className="text-sm font-medium text-foreground">
                    {order.plannedStart ? formatDate(order.plannedStart) : "—"} – {order.plannedEnd ? formatDate(order.plannedEnd) : "—"}
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

            <TabsContent value="output" className="mt-4">
              {entries.length === 0 ? (
                <EmptyState icon={FileText} title="No output recorded yet" description="Record output to see it here." />
              ) : (
                <Card className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Processed</TableHead>
                        <TableHead className="text-right">Output</TableHead>
                        <TableHead className="text-right">Issue</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Recorded By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...entries]
                        .sort((a, b) => b.recordedDate.localeCompare(a.recordedDate))
                        .map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{formatDate(entry.date)}</TableCell>
                            <TableCell className="text-right tabular-nums">{entry.processedQuantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right tabular-nums">{entry.outputQuantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right tabular-nums">{entry.issueQuantity.toLocaleString()}</TableCell>
                            <TableCell className="text-muted-foreground">{mockFinishingIssueReasons.find((r) => r.id === entry.issueReasonId)?.label ?? "—"}</TableCell>
                            <TableCell>{entry.recordedBy}</TableCell>
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

      <RecordFinishingOutputDialog open={recordOpen} onOpenChange={setRecordOpen} finishingOrder={order} />
    </div>
  );
}
