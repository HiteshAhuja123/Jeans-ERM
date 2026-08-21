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
import { getQcQuantitySummary } from "@/lib/post-sewing-utils";
import { recordQcInspectionSchema, type RecordQcInspectionValues } from "@/features/quality/schema";
import { qcInspectionActionHooks, qcInspectionEntryHooks, qcReworkHooks } from "@/features/quality/service";
import { mockQcDefectReasons } from "@/mock-data";
import { currentUser } from "@/mock-data/users";
import type { QcOrder } from "@/types";

export function RecordInspectionDialog({ open, onOpenChange, qcOrder }: { open: boolean; onOpenChange: (open: boolean) => void; qcOrder: QcOrder }) {
  const { data: entries = [] } = qcInspectionEntryHooks.useByQcOrder(qcOrder.id);
  const { data: reworks = [] } = qcReworkHooks.useByQcOrder(qcOrder.id);
  const recordMutation = qcInspectionActionHooks.useRecord();
  const remaining = getQcQuantitySummary(qcOrder, entries, reworks).remaining;

  const form = useForm<RecordQcInspectionValues>({
    resolver: zodResolver(recordQcInspectionSchema),
    values: {
      date: new Date().toISOString().slice(0, 10),
      inspectedQuantity: remaining,
      passedQuantity: remaining,
      reworkQuantity: 0,
      rejectedQuantity: 0,
      maxInspect: remaining,
      defectReasonId: undefined,
      notes: "",
    },
  });

  const inspectedQuantity = useWatch({ control: form.control, name: "inspectedQuantity" }) || 0;
  const passedQuantity = useWatch({ control: form.control, name: "passedQuantity" }) || 0;
  const reworkQuantity = useWatch({ control: form.control, name: "reworkQuantity" }) || 0;
  const rejectedQuantity = useWatch({ control: form.control, name: "rejectedQuantity" }) || 0;
  const accounted = Number(passedQuantity) + Number(reworkQuantity) + Number(rejectedQuantity);
  const needsReason = Number(reworkQuantity) + Number(rejectedQuantity) > 0;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await recordMutation.mutateAsync({
        qcOrder,
        date: values.date,
        inspectedQuantity: values.inspectedQuantity,
        passedQuantity: values.passedQuantity,
        reworkQuantity: values.reworkQuantity,
        rejectedQuantity: values.rejectedQuantity,
        defectReasonId: values.defectReasonId,
        notes: values.notes || undefined,
        inspector: currentUser.name,
      });
      toast.success(`Inspection recorded for ${qcOrder.qcOrderNumber}`);
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
          <DialogTitle>Record Inspection — {qcOrder.qcOrderNumber}</DialogTitle>
          <DialogDescription>{remaining.toLocaleString()} of {qcOrder.quantity.toLocaleString()} pcs still to inspect.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="record-qc-inspection-form" onSubmit={onSubmit} className="flex flex-col gap-4">
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
                name="inspectedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspected (pcs)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={remaining} inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="passedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passed</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} inputMode="numeric" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reworkQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rework</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} inputMode="numeric" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rejectedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejected</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} inputMode="numeric" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <p className={accounted === Number(inspectedQuantity) ? "rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground" : "rounded-lg border border-critical/25 bg-critical-subtle px-3 py-2 text-xs text-critical"}>
              Passed + Rework + Rejected = <span className="font-medium">{accounted.toLocaleString()}</span> — must equal the inspected quantity ({Number(inspectedQuantity).toLocaleString()})
            </p>
            <FormField control={form.control} name="passedQuantity" render={() => <FormMessage />} />

            {needsReason && (
              <FormField
                control={form.control}
                name="defectReasonId"
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
                        {mockQcDefectReasons
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
                    <Textarea rows={2} placeholder="e.g. Shade variation on part of the batch" {...field} />
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
          <Button type="submit" form="record-qc-inspection-form" disabled={recordMutation.isPending || remaining <= 0}>
            {recordMutation.isPending ? "Saving…" : "Record Inspection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
