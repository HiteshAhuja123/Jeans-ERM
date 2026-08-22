"use client";

import { useEffect, useMemo } from "react";
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
import { getQcOrderAvailableForPacking } from "@/lib/packing-utils";
import { createPackingOrderSchema, type CreatePackingOrderValues } from "@/features/packing/schema";
import { packingOrderActionHooks, packingOrderHooks } from "@/features/packing/service";
import { qcInspectionEntryHooks, qcOrderHooks, qcReworkHooks } from "@/features/quality/service";
import type { QcOrder } from "@/types";

export function CreatePackingOrderDialog({
  open,
  onOpenChange,
  initialQcOrderId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQcOrderId?: string;
}) {
  const router = useRouter();
  const { data: qcOrders = [] } = qcOrderHooks.useList();
  const { data: qcEntries = [] } = qcInspectionEntryHooks.useList();
  const { data: qcReworks = [] } = qcReworkHooks.useList();
  const { data: packingOrders = [] } = packingOrderHooks.useList();
  const createMutation = packingOrderActionHooks.useCreate();

  const eligible = useMemo(() => {
    return qcOrders
      .map((q: QcOrder) => ({
        qc: q,
        available: getQcOrderAvailableForPacking(q, qcEntries, qcReworks, packingOrders),
      }))
      .filter((e) => e.available > 0)
      .sort((a, b) => a.qc.qcOrderNumber.localeCompare(b.qc.qcOrderNumber));
  }, [qcOrders, qcEntries, qcReworks, packingOrders]);

  const form = useForm<CreatePackingOrderValues>({
    resolver: zodResolver(createPackingOrderSchema),
    defaultValues: { qcOrderId: "", quantity: 0, maxQuantity: 0, responsible: "", plannedStart: "", plannedEnd: "", notes: "" },
  });

  const selectedId = useWatch({ control: form.control, name: "qcOrderId" });
  const selected = eligible.find((e) => e.qc.id === selectedId);

  function handleSelectChange(qcOrderId: string) {
    const entry = eligible.find((e) => e.qc.id === qcOrderId);
    form.setValue("qcOrderId", qcOrderId);
    form.setValue("maxQuantity", entry?.available ?? 0);
    form.setValue("quantity", entry?.available ?? 0);
  }

  useEffect(() => {
    if (open && initialQcOrderId && selectedId !== initialQcOrderId && eligible.some((e) => e.qc.id === initialQcOrderId)) {
      handleSelectChange(initialQcOrderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialQcOrderId, eligible]);

  const onSubmit = form.handleSubmit(async (values) => {
    const qcOrder = qcOrders.find((q) => q.id === values.qcOrderId);
    if (!qcOrder) return;
    try {
      const created = await createMutation.mutateAsync({
        qcOrder,
        quantity: values.quantity,
        responsible: values.responsible,
        plannedStart: values.plannedStart,
        plannedEnd: values.plannedEnd,
        notes: values.notes || undefined,
      });
      toast.success(`${created.packingOrderNumber} created`);
      onOpenChange(false);
      form.reset();
      router.push(`/packing/${created.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Packing Order</DialogTitle>
          <DialogDescription>Pick the approved QC order this batch comes from.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="create-packing-order-form" onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="qcOrderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    QC Order <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={handleSelectChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an approved QC order" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eligible.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No QC-approved pieces are ready for packing right now.</div>
                      ) : (
                        eligible.map(({ qc, available }) => (
                          <SelectItem key={qc.id} value={qc.id}>
                            {qc.qcOrderNumber} — {qc.styleCode} · {qc.colorName} · {available.toLocaleString()} pcs available
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
                {selected.qc.customerName} · {selected.qc.productionOrderNumber} · {selected.available.toLocaleString()} pcs QC-approved and available
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
                    <Input placeholder="e.g. Ravi Chandran" {...field} />
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
          <Button type="submit" form="create-packing-order-form" disabled={createMutation.isPending || eligible.length === 0}>
            {createMutation.isPending ? "Creating…" : "Create Packing Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
