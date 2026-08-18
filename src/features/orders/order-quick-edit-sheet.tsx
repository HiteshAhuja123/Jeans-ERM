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
import { orderQuickEditSchema, type OrderQuickEditValues } from "@/features/orders/schema";
import { orderHooks } from "@/features/orders/service";
import type { Order } from "@/types";

interface OrderQuickEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

const priorityOptions: Array<{ value: OrderQuickEditValues["priority"]; label: string }> = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function valuesFromOrder(order: Order): OrderQuickEditValues {
  return {
    dueDate: order.dueDate,
    priority: order.priority,
    deliveryLocation: order.deliveryLocation ?? "",
    shippingInstructions: order.shippingInstructions ?? "",
    notes: order.notes ?? "",
    internalNotes: order.internalNotes ?? "",
  };
}

export function OrderQuickEditSheet({ open, onOpenChange, order }: OrderQuickEditSheetProps) {
  const updateMutation = orderHooks.useUpdate();

  const form = useForm<OrderQuickEditValues>({
    resolver: zodResolver(orderQuickEditSchema),
    defaultValues: valuesFromOrder(order),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(valuesFromOrder(order));
  }, [open, order, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        id: order.id,
        patch: {
          dueDate: values.dueDate,
          priority: values.priority,
          deliveryLocation: values.deliveryLocation || undefined,
          shippingInstructions: values.shippingInstructions || undefined,
          notes: values.notes || undefined,
          internalNotes: values.internalNotes || undefined,
        },
      });
      toast.success(`Order ${order.orderNumber} updated`);
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <EntityFormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Update Delivery & Notes"
      description="This order is in production — only delivery details and notes can change here."
      onSubmit={onSubmit}
      isSubmitting={updateMutation.isPending}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Delivery Date <span className="text-destructive">*</span>
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
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
          name="deliveryLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Location</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shippingInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shipping Instructions</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
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
        <FormField
          control={form.control}
          name="internalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Internal Notes</FormLabel>
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
