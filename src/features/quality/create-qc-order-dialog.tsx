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
import { getFinishingOrderAvailableForQc } from "@/lib/post-sewing-utils";
import { createQcOrderSchema, type CreateQcOrderValues } from "@/features/quality/schema";
import { qcOrderActionHooks, qcOrderHooks } from "@/features/quality/service";
import { finishingEntryHooks, finishingOrderHooks } from "@/features/finishing/service";
import type { FinishingOrder } from "@/types";

export function CreateQcOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { data: finishingOrders = [] } = finishingOrderHooks.useList();
  const { data: finishingEntries = [] } = finishingEntryHooks.useList();
  const { data: qcOrders = [] } = qcOrderHooks.useList();
  const createMutation = qcOrderActionHooks.useCreate();

  const eligible = useMemo(() => {
    return finishingOrders
      .map((f: FinishingOrder) => ({ fo: f, available: getFinishingOrderAvailableForQc(f, finishingEntries, qcOrders) }))
      .filter((e) => e.available > 0)
      .sort((a, b) => a.fo.finishingOrderNumber.localeCompare(b.fo.finishingOrderNumber));
  }, [finishingOrders, finishingEntries, qcOrders]);

  const form = useForm<CreateQcOrderValues>({
    resolver: zodResolver(createQcOrderSchema),
    defaultValues: { finishingOrderId: "", quantity: 0, maxQuantity: 0, inspector: "", plannedStart: "", notes: "" },
  });

  const selectedId = useWatch({ control: form.control, name: "finishingOrderId" });
  const selected = eligible.find((e) => e.fo.id === selectedId);

  function handleSelectChange(finishingOrderId: string) {
    const entry = eligible.find((e) => e.fo.id === finishingOrderId);
    form.setValue("finishingOrderId", finishingOrderId);
    form.setValue("maxQuantity", entry?.available ?? 0);
    form.setValue("quantity", entry?.available ?? 0);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const finishingOrder = finishingOrders.find((f) => f.id === values.finishingOrderId);
    if (!finishingOrder) return;
    try {
      const created = await createMutation.mutateAsync({
        finishingOrder,
        quantity: values.quantity,
        inspector: values.inspector,
        plannedStart: values.plannedStart,
        notes: values.notes || undefined,
      });
      toast.success(`${created.qcOrderNumber} created`);
      onOpenChange(false);
      form.reset();
      router.push(`/quality/${created.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create QC Order</DialogTitle>
          <DialogDescription>Pick the finishing order this batch comes from.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="create-qc-order-form" onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="finishingOrderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Finishing Order <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={handleSelectChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a finishing order" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eligible.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No finishing orders have good output ready for QC right now.</div>
                      ) : (
                        eligible.map(({ fo, available }) => (
                          <SelectItem key={fo.id} value={fo.id}>
                            {fo.finishingOrderNumber} — {fo.styleCode} · {fo.colorName} · {available.toLocaleString()} pcs available
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
                {selected.fo.customerName} · {selected.fo.productionOrderNumber} · {selected.available.toLocaleString()} pcs of finished output available
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
              name="inspector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspector</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Sunita Rao" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          <Button type="submit" form="create-qc-order-form" disabled={createMutation.isPending || eligible.length === 0}>
            {createMutation.isPending ? "Creating…" : "Create QC Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
