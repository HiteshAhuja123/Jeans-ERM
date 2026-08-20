"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { orderPriorityMeta } from "@/lib/status";
import { createSewingOrderSchema, type CreateSewingOrderValues } from "@/features/sewing/schema";
import { sewingOrderActionHooks } from "@/features/sewing/service";
import { bundleHooks } from "@/features/cutting/bundle-service";
import { productionOrderHooks } from "@/features/production/service";
import type { ProductionOrder } from "@/types";

const eligibleStages: ProductionOrder["currentStage"][] = ["cutting", "sewing"];

export function CreateSewingOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { data: productionOrders = [] } = productionOrderHooks.useList();
  const { data: bundles = [] } = bundleHooks.useList();
  const createMutation = sewingOrderActionHooks.useCreate();

  const eligibleOrders = useMemo(() => {
    const withReadyBundles = new Set(bundles.filter((b) => b.status === "ready_for_sewing").map((b) => b.productionOrderId));
    return productionOrders
      .filter((po) => eligibleStages.includes(po.currentStage) && po.status !== "cancelled" && po.status !== "completed")
      .filter((po) => withReadyBundles.has(po.id))
      .sort((a, b) => a.productionOrderNumber.localeCompare(b.productionOrderNumber));
  }, [productionOrders, bundles]);

  const form = useForm<CreateSewingOrderValues>({
    resolver: zodResolver(createSewingOrderSchema),
    defaultValues: { productionOrderId: "", priority: "normal", notes: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const productionOrder = productionOrders.find((po) => po.id === values.productionOrderId);
    if (!productionOrder) return;
    try {
      const created = await createMutation.mutateAsync({ productionOrder, priority: values.priority, notes: values.notes || undefined });
      toast.success(`${created.sewingOrderNumber} created`);
      onOpenChange(false);
      form.reset();
      router.push(`/sewing/orders/${created.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Sewing Order</DialogTitle>
          <DialogDescription>Pick the production order this sewing run belongs to. You&apos;ll assign bundles and a line next.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="create-sewing-order-form" onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="productionOrderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Production Order <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a production order" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eligibleOrders.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No production orders have bundles ready for sewing right now.</div>
                      ) : (
                        eligibleOrders.map((po) => (
                          <SelectItem key={po.id} value={po.id}>
                            {po.productionOrderNumber} — {po.styleCode} · {po.colorName} · {po.customerName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(orderPriorityMeta).map(([value, meta]) => (
                        <SelectItem key={value} value={value}>
                          {meta.label}
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
          <Button type="submit" form="create-sewing-order-form" disabled={createMutation.isPending || eligibleOrders.length === 0}>
            {createMutation.isPending ? "Creating…" : "Create Sewing Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
