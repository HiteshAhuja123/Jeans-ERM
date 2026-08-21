"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getProcessingOrderAvailableForFinishing } from "@/lib/post-sewing-utils";
import { createFinishingOrderSchema, type CreateFinishingOrderValues } from "@/features/finishing/schema";
import { finishingOrderActionHooks, finishingOrderHooks } from "@/features/finishing/service";
import { processingOrderHooks, processingTransactionHooks } from "@/features/processing/service";
import type { ProcessingOrder } from "@/types";

export function CreateFinishingOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { data: processingOrders = [] } = processingOrderHooks.useList();
  const { data: transactions = [] } = processingTransactionHooks.useList();
  const { data: finishingOrders = [] } = finishingOrderHooks.useList();
  const createMutation = finishingOrderActionHooks.useCreate();

  const eligible = useMemo(() => {
    return processingOrders
      .map((p: ProcessingOrder) => ({
        po: p,
        available: getProcessingOrderAvailableForFinishing(p, transactions, finishingOrders),
      }))
      .filter((e) => e.available > 0)
      .sort((a, b) => a.po.processingOrderNumber.localeCompare(b.po.processingOrderNumber));
  }, [processingOrders, transactions, finishingOrders]);

  const form = useForm<CreateFinishingOrderValues>({
    resolver: zodResolver(createFinishingOrderSchema),
    defaultValues: { processingOrderId: "", quantity: 0, maxQuantity: 0, responsible: "", plannedStart: "", plannedEnd: "", notes: "" },
  });

  const selectedId = useWatch({ control: form.control, name: "processingOrderId" });
  const selected = eligible.find((e) => e.po.id === selectedId);

  function handleSelectChange(processingOrderId: string) {
    const entry = eligible.find((e) => e.po.id === processingOrderId);
    form.setValue("processingOrderId", processingOrderId);
    form.setValue("maxQuantity", entry?.available ?? 0);
    form.setValue("quantity", entry?.available ?? 0);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const processingOrder = processingOrders.find((p) => p.id === values.processingOrderId);
    if (!processingOrder) return;
    try {
      const created = await createMutation.mutateAsync({
        processingOrder,
        quantity: values.quantity,
        responsible: values.responsible,
        plannedStart: values.plannedStart,
        plannedEnd: values.plannedEnd,
        notes: values.notes || undefined,
      });
      toast.success(`${created.finishingOrderNumber} created`);
      onOpenChange(false);
      form.reset();
      router.push(`/finishing/${created.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Finishing Order</DialogTitle>
          <DialogDescription>Pick the processing order this batch comes from.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="create-finishing-order-form" onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="processingOrderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Processing Order <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={handleSelectChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a processing order" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eligible.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No processing orders have received quantity ready for finishing right now.</div>
                      ) : (
                        eligible.map(({ po, available }) => (
                          <SelectItem key={po.id} value={po.id}>
                            {po.processingOrderNumber} — {po.styleCode} · {po.colorName} · {available.toLocaleString()} pcs available
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selected && (
              <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                {selected.po.customerName} · {selected.po.productionOrderNumber} · {selected.available.toLocaleString()} pcs received and available
              </p>
            )}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity (pcs)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={selected?.available ?? 0} inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="responsible"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsible User/Team</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Kavya Reddy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="plannedStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planned Start</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plannedEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planned End</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="create-finishing-order-form" disabled={createMutation.isPending || eligible.length === 0}>
            {createMutation.isPending ? "Creating…" : "Create Finishing Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
