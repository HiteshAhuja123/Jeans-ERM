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
import { getProcessingSendableQuantity } from "@/lib/post-sewing-utils";
import { sendProcessingSchema, type SendProcessingValues } from "@/features/processing/schema";
import { processingOrderActionHooks, processingTransactionHooks } from "@/features/processing/service";
import { currentUser } from "@/mock-data/users";
import type { ProcessingOrder } from "@/types";

export function SendProcessingDialog({ processingOrder }: { processingOrder: ProcessingOrder }) {
  const [open, setOpen] = useState(false);
  const { data: transactions = [] } = processingTransactionHooks.useByProcessingOrder(processingOrder.id);
  const sendMutation = processingOrderActionHooks.useSend();
  const sendable = getProcessingSendableQuantity(processingOrder, transactions);

  const form = useForm<SendProcessingValues>({
    resolver: zodResolver(sendProcessingSchema),
    values: { quantity: sendable, maxQuantity: sendable, date: new Date().toISOString().slice(0, 10), notes: "" },
  });

  if (processingOrder.mode !== "outsourced") return null;
  if (processingOrder.status !== "planned" && processingOrder.status !== "in_progress" && processingOrder.status !== "partially_received") return null;
  if (sendable <= 0) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await sendMutation.mutateAsync({ processingOrder, quantity: values.quantity, date: values.date, notes: values.notes || undefined, recordedBy: currentUser.name });
      toast.success(`${values.quantity.toLocaleString()} pcs sent to ${processingOrder.vendorName}`);
      setOpen(false);
      form.reset();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Send to Vendor
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to {processingOrder.vendorName}</DialogTitle>
            <DialogDescription>{sendable.toLocaleString()} of {processingOrder.quantity.toLocaleString()} pcs still to send on this order.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form id="send-processing-form" onSubmit={onSubmit} className="flex flex-col gap-4">
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
                        <Input type="number" min={0} max={sendable} inputMode="numeric" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={sendMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" form="send-processing-form" disabled={sendMutation.isPending}>
              {sendMutation.isPending ? "Sending…" : "Send to Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
