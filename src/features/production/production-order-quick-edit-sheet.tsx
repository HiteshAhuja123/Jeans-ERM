"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EntityFormSheet } from "@/components/shared/entity-form-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  productionOrderQuickEditSchema,
  type ProductionOrderQuickEditValues,
} from "@/features/production/schema";
import { productionOrderHooks } from "@/features/production/service";
import { productionLineHooks } from "@/features/production-lines/service";
import type { ProductionOrder } from "@/types";

interface ProductionOrderQuickEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionOrder: ProductionOrder;
}

function valuesFromPo(po: ProductionOrder): ProductionOrderQuickEditValues {
  return {
    productionLineId: po.productionLineId ?? "",
    plannedStart: po.plannedStart,
    plannedEnd: po.plannedEnd,
    priority: po.priority,
    notes: po.notes ?? "",
  };
}

export function ProductionOrderQuickEditSheet({ open, onOpenChange, productionOrder }: ProductionOrderQuickEditSheetProps) {
  const { data: lines = [] } = productionLineHooks.useList();
  const updateMutation = productionOrderHooks.useUpdate();

  const form = useForm<ProductionOrderQuickEditValues>({
    resolver: zodResolver(productionOrderQuickEditSchema),
    defaultValues: valuesFromPo(productionOrder),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(valuesFromPo(productionOrder));
  }, [open, productionOrder, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const line = lines.find((l) => l.id === values.productionLineId);
    try {
      await updateMutation.mutateAsync({
        id: productionOrder.id,
        patch: {
          productionLineId: values.productionLineId || undefined,
          supervisor: line?.supervisor ?? productionOrder.supervisor,
          plannedStart: values.plannedStart,
          plannedEnd: values.plannedEnd,
          priority: values.priority,
          notes: values.notes || undefined,
        },
      });
      toast.success(`${productionOrder.productionOrderNumber} updated`);
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <EntityFormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Update Production Order"
      description="Adjust the production line, schedule and priority."
      onSubmit={onSubmit}
      isSubmitting={updateMutation.isPending}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="productionLineId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Production Line</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {lines
                    .filter((l) => l.status === "active")
                    .map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
                <FormLabel>
                  Planned Start <span className="text-destructive">*</span>
                </FormLabel>
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
                <FormLabel>
                  Planned End <span className="text-destructive">*</span>
                </FormLabel>
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
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
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
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </EntityFormSheet>
  );
}
