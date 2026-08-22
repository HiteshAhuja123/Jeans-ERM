"use client";

import { useEffect, useMemo, useState } from "react";
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
import { getFinishedGoodsAvailable } from "@/lib/finished-goods-utils";
import { createDispatchOrderSchema, type CreateDispatchOrderValues } from "@/features/dispatch/schema";
import { dispatchOrderActionHooks } from "@/features/dispatch/service";
import { finishedGoodsHooks } from "@/features/inventory/finished-goods-service";
import { orderHooks } from "@/features/orders/service";
import { currentUser } from "@/mock-data/users";
import type { FinishedGoodsBalance, Order } from "@/types";

export function CreateDispatchDialog({
  open,
  onOpenChange,
  initialOrderId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialOrderId?: string;
}) {
  const router = useRouter();
  const { data: orders = [] } = orderHooks.useList();
  const { data: fgBalances = [] } = finishedGoodsHooks.useList();
  const createMutation = dispatchOrderActionHooks.useCreate();

  /** Sparse — only lines the user has explicitly edited. Unedited lines fall back to `defaultQuantities` (full available). */
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  const ordersWithStock = useMemo(() => {
    const orderIdsWithStock = new Set(fgBalances.filter((b) => getFinishedGoodsAvailable(b) > 0).map((b) => b.orderId));
    return orders.filter((o) => orderIdsWithStock.has(o.id)).sort((a, b) => a.orderNumber.localeCompare(b.orderNumber));
  }, [orders, fgBalances]);

  const form = useForm<CreateDispatchOrderValues>({
    resolver: zodResolver(createDispatchOrderSchema),
    defaultValues: { orderId: "", dispatchDate: new Date().toISOString().slice(0, 10), carrier: "", trackingRef: "", notes: "" },
  });

  const orderId = useWatch({ control: form.control, name: "orderId" });
  const selectedOrder: Order | undefined = orders.find((o) => o.id === orderId);
  const lines: FinishedGoodsBalance[] = useMemo(
    () => fgBalances.filter((b) => b.orderId === orderId && getFinishedGoodsAvailable(b) > 0),
    [fgBalances, orderId],
  );

  useEffect(() => {
    if (open && initialOrderId && orderId !== initialOrderId && ordersWithStock.some((o) => o.id === initialOrderId)) {
      form.setValue("orderId", initialOrderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialOrderId, ordersWithStock]);

  const defaultQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    for (const line of lines) map[line.productionOrderId] = getFinishedGoodsAvailable(line);
    return map;
  }, [lines]);

  function quantityFor(productionOrderId: string): number {
    return overrides[productionOrderId] ?? defaultQuantities[productionOrderId] ?? 0;
  }

  const totalQuantity = lines.reduce((sum, line) => sum + quantityFor(line.productionOrderId), 0);
  const hasInvalidLine = lines.some((line) => {
    const qty = quantityFor(line.productionOrderId);
    return qty < 0 || qty > getFinishedGoodsAvailable(line);
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!selectedOrder) return;
    const dispatchLines = lines
      .map((line) => ({
        productionOrderId: line.productionOrderId,
        productionOrderNumber: line.productionOrderNumber,
        styleId: line.styleId,
        styleCode: line.styleCode,
        styleName: line.styleName,
        colorId: line.colorId,
        colorName: line.colorName,
        skuId: line.skuId,
        quantity: quantityFor(line.productionOrderId),
        unit: line.unit,
      }))
      .filter((line) => line.quantity > 0);

    if (dispatchLines.length === 0) {
      toast.error("Enter a dispatch quantity for at least one line.");
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        order: selectedOrder,
        lines: dispatchLines,
        dispatchDate: values.dispatchDate,
        carrier: values.carrier,
        trackingRef: values.trackingRef,
        notes: values.notes || undefined,
        recordedBy: currentUser.name,
      });
      toast.success(`${created.dispatchOrderNumber} created — ${created.quantity.toLocaleString()} pcs dispatched`);
      onOpenChange(false);
      form.reset();
      router.push(`/dispatch/${created.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Dispatch</DialogTitle>
          <DialogDescription>Pick an order and dispatch from its available Finished Goods.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="create-dispatch-form" onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="orderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Order <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an order with available stock" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ordersWithStock.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No orders currently have Finished Goods available to dispatch.</div>
                      ) : (
                        ordersWithStock.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.orderNumber} — {o.customerName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {lines.length > 0 && (
              <div className="flex flex-col gap-2">
                <FormLabel>Finished Goods to Dispatch</FormLabel>
                <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
                  {lines.map((line) => (
                    <div key={line.productionOrderId} className="flex items-center justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{line.styleCode} · {line.colorName}</span>
                        <span className="text-xs text-muted-foreground">
                          {line.productionOrderNumber} · {getFinishedGoodsAvailable(line).toLocaleString()} {line.unit} available
                        </span>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={getFinishedGoodsAvailable(line)}
                        inputMode="numeric"
                        className="w-28"
                        value={quantityFor(line.productionOrderId)}
                        onChange={(e) => setOverrides((prev) => ({ ...prev, [line.productionOrderId]: Number(e.target.value) }))}
                      />
                    </div>
                  ))}
                </div>
                <p className={hasInvalidLine ? "text-xs text-critical" : "text-xs text-muted-foreground"}>
                  {hasInvalidLine ? "One or more lines exceed the available quantity." : `Total: ${totalQuantity.toLocaleString()} pcs`}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="dispatchDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dispatch Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="carrier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carrier</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. DHL Freight" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="trackingRef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking Reference</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. AWB / container number" {...field} />
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
          <Button type="submit" form="create-dispatch-form" disabled={createMutation.isPending || lines.length === 0 || hasInvalidLine || totalQuantity <= 0}>
            {createMutation.isPending ? "Creating…" : "Create Dispatch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
