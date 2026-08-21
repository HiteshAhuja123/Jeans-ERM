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
import { getSewingOrderAvailableForProcessing } from "@/lib/post-sewing-utils";
import { createProcessingOrderSchema, type CreateProcessingOrderValues } from "@/features/processing/schema";
import { processingOrderActionHooks, processingOrderHooks } from "@/features/processing/service";
import { processingTypeHooks } from "@/features/processing-types/service";
import { sewingOrderHooks, sewingProductionEntryHooks, sewingReworkHooks } from "@/features/sewing/service";
import { supplierHooks } from "@/features/suppliers/service";
import type { SewingOrder } from "@/types";

export function CreateProcessingOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { data: sewingOrders = [] } = sewingOrderHooks.useList();
  const { data: sewingEntries = [] } = sewingProductionEntryHooks.useList();
  const { data: sewingReworks = [] } = sewingReworkHooks.useList();
  const { data: processingOrders = [] } = processingOrderHooks.useList();
  const { data: processingTypes = [] } = processingTypeHooks.useList();
  const { data: suppliers = [] } = supplierHooks.useList();
  const createMutation = processingOrderActionHooks.useCreate();

  const eligibleSewingOrders = useMemo(() => {
    return sewingOrders
      .map((so: SewingOrder) => ({ so, available: getSewingOrderAvailableForProcessing(so, sewingEntries, sewingReworks, processingOrders) }))
      .filter((e) => e.available > 0)
      .sort((a, b) => a.so.sewingOrderNumber.localeCompare(b.so.sewingOrderNumber));
  }, [sewingOrders, sewingEntries, sewingReworks, processingOrders]);

  const activeProcessingTypes = useMemo(() => processingTypes.filter((t) => t.status === "active"), [processingTypes]);
  const vendors = useMemo(() => suppliers.filter((s) => (s.type === "washing_vendor" || s.type === "processing_vendor") && s.status === "active"), [suppliers]);

  const form = useForm<CreateProcessingOrderValues>({
    resolver: zodResolver(createProcessingOrderSchema),
    defaultValues: { sewingOrderId: "", processingTypeId: "", quantity: 0, maxQuantity: 0, mode: "internal", vendorId: undefined, plannedStart: "", plannedEnd: "", notes: "" },
  });

  const selectedSewingOrderId = useWatch({ control: form.control, name: "sewingOrderId" });
  const mode = useWatch({ control: form.control, name: "mode" });
  const selected = eligibleSewingOrders.find((e) => e.so.id === selectedSewingOrderId);

  function handleSewingOrderChange(sewingOrderId: string) {
    const entry = eligibleSewingOrders.find((e) => e.so.id === sewingOrderId);
    form.setValue("sewingOrderId", sewingOrderId);
    form.setValue("maxQuantity", entry?.available ?? 0);
    form.setValue("quantity", entry?.available ?? 0);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const sewingOrder = sewingOrders.find((so: SewingOrder) => so.id === values.sewingOrderId);
    const processingType = processingTypes.find((t) => t.id === values.processingTypeId);
    const vendor = suppliers.find((s) => s.id === values.vendorId);
    if (!sewingOrder || !processingType) return;
    try {
      const created = await createMutation.mutateAsync({
        sewingOrder,
        processingType,
        quantity: values.quantity,
        mode: values.mode,
        vendor: values.mode === "outsourced" ? vendor : undefined,
        plannedStart: values.plannedStart,
        plannedEnd: values.plannedEnd,
        notes: values.notes || undefined,
      });
      toast.success(`${created.processingOrderNumber} created`);
      onOpenChange(false);
      form.reset();
      router.push(`/processing/${created.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Processing Order</DialogTitle>
          <DialogDescription>Pick the sewing order this batch comes from and how it should be processed.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="create-processing-order-form" onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="sewingOrderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Sewing Order <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={handleSewingOrderChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a sewing order" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eligibleSewingOrders.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No sewing orders have good output ready for processing right now.</div>
                      ) : (
                        eligibleSewingOrders.map(({ so, available }) => (
                          <SelectItem key={so.id} value={so.id}>
                            {so.sewingOrderNumber} — {so.styleCode} · {so.colorName} · {available.toLocaleString()} pcs available
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
                {selected.so.customerName} · {selected.so.productionOrderNumber} · {selected.available.toLocaleString()} pcs of good output available
              </p>
            )}
            <FormField
              control={form.control}
              name="processingTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Processing Type <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a processing type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeProcessingTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Input type="number" min={0} max={selected?.available ?? 0} inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mode</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="outsourced">Outsourced</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {mode === "outsourced" && (
              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Vendor <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendors.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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
          <Button type="submit" form="create-processing-order-form" disabled={createMutation.isPending || eligibleSewingOrders.length === 0}>
            {createMutation.isPending ? "Creating…" : "Create Processing Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
