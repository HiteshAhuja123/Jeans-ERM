"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getProcessingReceivableQuantity } from "@/lib/post-sewing-utils";
import { recordProcessingReceiptSchema, type RecordProcessingReceiptValues } from "@/features/processing/schema";
import { processingOrderActionHooks, processingTransactionHooks } from "@/features/processing/service";
import { currentUser } from "@/mock-data/users";
import type { ProcessingOrder } from "@/types";

export function RecordProcessingReceiptDialog({ processingOrder }: { processingOrder: ProcessingOrder }) {
  const [open, setOpen] = useState(false);
  const { data: transactions = [] } = processingTransactionHooks.useByProcessingOrder(processingOrder.id);
  const recordMutation = processingOrderActionHooks.useRecordReceipt();
  const receivable = getProcessingReceivableQuantity(processingOrder, transactions);

  const form = useForm<RecordProcessingReceiptValues>({
    resolver: zodResolver(recordProcessingReceiptSchema),
    values: { quantity: receivable, maxQuantity: receivable, date: new Date().toISOString().slice(0, 10), issueNotes: "" },
  });

  if (processingOrder.status !== "in_progress" && processingOrder.status !== "partially_received" && processingOrder.status !== "planned") return null;
  if (processingOrder.mode === "internal" && processingOrder.status === "planned") return null;
  if (receivable <= 0) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await recordMutation.mutateAsync({
        processingOrder,
        quantity: values.quantity,
        date: values.date,
        issueNotes: values.issueNotes || undefined,
        recordedBy: currentUser.name,
      });
      toast.success(`${values.quantity.toLocaleString()} pcs received on ${processingOrder.processingOrderNumber}`);
      setOpen(false);
      form.reset();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>Record Receipt</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Receipt — {processingOrder.processingOrderNumber}</DialogTitle>
            <DialogDescription>{receivable.toLocaleString()} pcs are currently available to receive back.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form id="record-receipt-form" onSubmit={onSubmit} className="flex flex-col gap-4">
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
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity (pcs)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={receivable} inputMode="numeric" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="issueNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delay / Issue Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="e.g. Vendor machine breakdown, 2 day delay on the rest" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={recordMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" form="record-receipt-form" disabled={recordMutation.isPending}>
              {recordMutation.isPending ? "Saving…" : "Record Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
