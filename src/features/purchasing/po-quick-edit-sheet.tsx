"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EntityFormSheet } from "@/components/shared/entity-form-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { poQuickEditSchema, type PoQuickEditValues } from "@/features/purchasing/schema";
import { purchaseOrderHooks } from "@/features/purchasing/service";
import type { PurchaseOrder } from "@/types";

interface PoQuickEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  po: PurchaseOrder;
}

export function PoQuickEditSheet({ open, onOpenChange, po }: PoQuickEditSheetProps) {
  const updateMutation = purchaseOrderHooks.useUpdate();

  const form = useForm<PoQuickEditValues>({
    resolver: zodResolver(poQuickEditSchema),
    defaultValues: { expectedDate: po.expectedDate, notes: po.notes ?? "" },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({ expectedDate: po.expectedDate, notes: po.notes ?? "" });
  }, [open, po, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        id: po.id,
        patch: { expectedDate: values.expectedDate, notes: values.notes || undefined },
      });
      toast.success(`Purchase order ${po.poNumber} updated`);
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <EntityFormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Update Purchase Order"
      description="Once a purchase order is sent, only the expected delivery date and notes can change here."
      onSubmit={onSubmit}
      isSubmitting={updateMutation.isPending}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="expectedDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Expected Delivery <span className="text-destructive">*</span>
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
