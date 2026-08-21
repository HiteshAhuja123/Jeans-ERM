"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getFinishingOrderQuantitySummary } from "@/lib/post-sewing-utils";
import { recordFinishingOutputSchema, type RecordFinishingOutputValues } from "@/features/finishing/schema";
import { finishingEntryHooks, finishingProductionActionHooks } from "@/features/finishing/service";
import { mockFinishingIssueReasons } from "@/mock-data";
import { currentUser } from "@/mock-data/users";
import type { FinishingOrder } from "@/types";

export function RecordFinishingOutputDialog({ open, onOpenChange, finishingOrder }: { open: boolean; onOpenChange: (open: boolean) => void; finishingOrder: FinishingOrder }) {
  const { data: entries = [] } = finishingEntryHooks.useByFinishingOrder(finishingOrder.id);
  const recordMutation = finishingProductionActionHooks.useRecord();
  const remaining = getFinishingOrderQuantitySummary(finishingOrder, entries).remaining;

  const form = useForm<RecordFinishingOutputValues>({
    resolver: zodResolver(recordFinishingOutputSchema),
    values: {
      date: new Date().toISOString().slice(0, 10),
      processedQuantity: remaining,
      outputQuantity: remaining,
      issueQuantity: 0,
      maxProcessed: remaining,
      issueReasonId: undefined,
      notes: "",
    },
  });

  const processedQuantity = useWatch({ control: form.control, name: "processedQuantity" }) || 0;
  const outputQuantity = useWatch({ control: form.control, name: "outputQuantity" }) || 0;
  const issueQuantity = useWatch({ control: form.control, name: "issueQuantity" }) || 0;
  const accounted = Number(outputQuantity) + Number(issueQuantity);
  const needsReason = Number(issueQuantity) > 0;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await recordMutation.mutateAsync({
        finishingOrder,
        date: values.date,
        processedQuantity: values.processedQuantity,
        outputQuantity: values.outputQuantity,
        issueQuantity: values.issueQuantity,
        issueReasonId: values.issueReasonId,
        notes: values.notes || undefined,
        recordedBy: currentUser.name,
      });
      toast.success(`Output recorded for ${finishingOrder.finishingOrderNumber}`);
      onOpenChange(false);
      form.reset();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Output — {finishingOrder.finishingOrderNumber}</DialogTitle>
          <DialogDescription>{remaining.toLocaleString()} of {finishingOrder.quantity.toLocaleString()} pcs still to finish.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="record-finishing-output-form" onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="processedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Processed (pcs)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={remaining} inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="outputQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Output (Good)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} inputMode="numeric" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="issueQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue / Defect</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} inputMode="numeric" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <p className={accounted === Number(processedQuantity) ? "rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground" : "rounded-lg border border-critical/25 bg-critical-subtle px-3 py-2 text-xs text-critical"}>
              Output + Issue = <span className="font-medium">{accounted.toLocaleString()}</span> — must equal the processed quantity ({Number(processedQuantity).toLocaleString()})
            </p>
            <FormField control={form.control} name="outputQuantity" render={() => <FormMessage />} />

            {needsReason && (
              <FormField
                control={form.control}
                name="issueReasonId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Reason <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockFinishingIssueReasons
                          .filter((r) => r.status === "active")
                          .map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="e.g. Stain marks found during pressing" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={recordMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="record-finishing-output-form" disabled={recordMutation.isPending || remaining <= 0}>
            {recordMutation.isPending ? "Saving…" : "Record Output"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
