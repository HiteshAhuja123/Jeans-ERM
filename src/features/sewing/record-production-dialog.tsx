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
import { getBundleRemainingQuantity } from "@/lib/sewing-utils";
import { recordSewingProductionSchema, type RecordSewingProductionValues } from "@/features/sewing/schema";
import { sewingProductionActionHooks, sewingProductionEntryHooks } from "@/features/sewing/service";
import { mockSewingDefectReasons } from "@/mock-data";
import { currentUser } from "@/mock-data/users";
import type { Bundle, SewingOrder } from "@/types";

export function RecordProductionDialog({
  open,
  onOpenChange,
  sewingOrder,
  bundle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sewingOrder: SewingOrder;
  bundle: Bundle;
}) {
  const { data: entries = [] } = sewingProductionEntryHooks.useBySewingOrder(sewingOrder.id);
  const recordMutation = sewingProductionActionHooks.useRecord();
  const remaining = getBundleRemainingQuantity(bundle, entries);

  const form = useForm<RecordSewingProductionValues>({
    resolver: zodResolver(recordSewingProductionSchema),
    values: {
      date: new Date().toISOString().slice(0, 10),
      inputQuantity: remaining,
      goodQuantity: remaining,
      rejectedQuantity: 0,
      reworkQuantity: 0,
      maxInput: remaining,
      reasonId: undefined,
      notes: "",
    },
  });

  const inputQuantity = useWatch({ control: form.control, name: "inputQuantity" }) || 0;
  const goodQuantity = useWatch({ control: form.control, name: "goodQuantity" }) || 0;
  const rejectedQuantity = useWatch({ control: form.control, name: "rejectedQuantity" }) || 0;
  const reworkQuantity = useWatch({ control: form.control, name: "reworkQuantity" }) || 0;
  const accounted = Number(goodQuantity) + Number(rejectedQuantity) + Number(reworkQuantity);
  const needsReason = Number(rejectedQuantity) + Number(reworkQuantity) > 0;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await recordMutation.mutateAsync({
        sewingOrder,
        bundle,
        date: values.date,
        inputQuantity: values.inputQuantity,
        goodQuantity: values.goodQuantity,
        rejectedQuantity: values.rejectedQuantity,
        reworkQuantity: values.reworkQuantity,
        reasonId: values.reasonId,
        notes: values.notes || undefined,
        recordedBy: currentUser.name,
      });
      toast.success(`Production recorded for ${bundle.bundleNumber}`);
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
          <DialogTitle>Record Production — {bundle.bundleNumber}</DialogTitle>
          <DialogDescription>
            {remaining.toLocaleString()} of {bundle.quantity.toLocaleString()} pcs still to sew on this bundle.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="record-production-form" onSubmit={onSubmit} className="flex flex-col gap-4">
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
                name="inputQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Input (pcs)</FormLabel>
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
                name="goodQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Good</FormLabel>
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
            </div>
            <p className={accounted === Number(inputQuantity) ? "rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground" : "rounded-lg border border-critical/25 bg-critical-subtle px-3 py-2 text-xs text-critical"}>
              Good + Rejected + Rework = <span className="font-medium">{accounted.toLocaleString()}</span> — must equal the input quantity ({Number(inputQuantity).toLocaleString()})
            </p>
            <FormField control={form.control} name="goodQuantity" render={() => <FormMessage />} />

            {needsReason && (
              <FormField
                control={form.control}
                name="reasonId"
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
                        {mockSewingDefectReasons
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
                    <Textarea rows={2} placeholder="e.g. Minor stitch issue" {...field} />
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
          <Button type="submit" form="record-production-form" disabled={recordMutation.isPending || remaining <= 0}>
            {recordMutation.isPending ? "Saving…" : "Record Production"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
