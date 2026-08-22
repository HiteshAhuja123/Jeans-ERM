"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getPackingOrderQuantitySummary } from "@/lib/packing-utils";
import { recordPackingSchema, type RecordPackingValues } from "@/features/packing/schema";
import { packingEntryHooks, packingProductionActionHooks } from "@/features/packing/service";
import { currentUser } from "@/mock-data/users";
import type { PackingOrder } from "@/types";

export function RecordPackingDialog({ open, onOpenChange, packingOrder }: { open: boolean; onOpenChange: (open: boolean) => void; packingOrder: PackingOrder }) {
  const { data: entries = [] } = packingEntryHooks.useByPackingOrder(packingOrder.id);
  const recordMutation = packingProductionActionHooks.useRecord();
  const remaining = getPackingOrderQuantitySummary(packingOrder, entries).remaining;
  const defaultCartons = Math.max(1, Math.ceil(remaining / 50));

  const form = useForm<RecordPackingValues>({
    resolver: zodResolver(recordPackingSchema),
    values: {
      date: new Date().toISOString().slice(0, 10),
      packedQuantity: remaining,
      cartonCount: defaultCartons,
      maxPack: remaining,
      notes: "",
    },
  });

  const packedQuantity = Number(useWatch({ control: form.control, name: "packedQuantity" })) || 0;
  const cartonCount = Number(useWatch({ control: form.control, name: "cartonCount" })) || 0;
  const perCarton = cartonCount > 0 ? Math.floor(packedQuantity / cartonCount) : 0;
  const cartonRemainder = cartonCount > 0 ? packedQuantity % cartonCount : 0;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await recordMutation.mutateAsync({
        packingOrder,
        date: values.date,
        packedQuantity: values.packedQuantity,
        cartonCount: values.cartonCount,
        notes: values.notes || undefined,
        recordedBy: currentUser.name,
      });
      toast.success(`Packing recorded for ${packingOrder.packingOrderNumber}`);
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
          <DialogTitle>Record Packing — {packingOrder.packingOrderNumber}</DialogTitle>
          <DialogDescription>{remaining.toLocaleString()} of {packingOrder.quantity.toLocaleString()} pcs still to pack.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="record-packing-form" onSubmit={onSubmit} className="flex flex-col gap-4">
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
                name="packedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Packed (pcs)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={remaining} inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cartonCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Cartons</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={Math.max(1, packedQuantity)} inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {cartonCount > 0 && packedQuantity > 0 && (
              <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                {cartonRemainder === 0
                  ? `${cartonCount.toLocaleString()} cartons of ${perCarton.toLocaleString()} pcs each`
                  : `${cartonRemainder.toLocaleString()} carton${cartonRemainder === 1 ? "" : "s"} of ${(perCarton + 1).toLocaleString()} pcs, ${(cartonCount - cartonRemainder).toLocaleString()} carton${cartonCount - cartonRemainder === 1 ? "" : "s"} of ${perCarton.toLocaleString()} pcs`}
              </p>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="e.g. Export cartons, size-mixed per PO" {...field} />
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
          <Button type="submit" form="record-packing-form" disabled={recordMutation.isPending || remaining <= 0}>
            {recordMutation.isPending ? "Saving…" : "Record Packing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
