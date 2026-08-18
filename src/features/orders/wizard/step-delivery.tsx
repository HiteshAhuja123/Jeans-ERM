"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";

import { Card } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import { orderPriorityMeta } from "@/lib/status";
import type { OrderFormValues } from "@/features/orders/schema";

export function StepDelivery({ form }: { form: UseFormReturn<OrderFormValues> }) {
  const dueDate = useWatch({ control: form.control, name: "dueDate" });
  const priority = useWatch({ control: form.control, name: "priority" });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Delivery Information</h2>
        <p className="text-sm text-muted-foreground">Where this order ships to and how.</p>
      </div>

      <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Delivery Date</span>
          <span className="font-medium text-foreground">{dueDate ? formatDate(dueDate) : "—"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Priority</span>
          <span className="font-medium text-foreground">{orderPriorityMeta[priority]?.label ?? "—"}</span>
        </div>
        <p className="text-xs text-muted-foreground">Set on the Order Information step.</p>
      </Card>

      <FormField
        control={form.control}
        name="deliveryLocation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Delivery Location</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Port of Newark, NJ, USA" {...field} />
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
              <Textarea placeholder="Freight terms, carrier preferences, packing requirements…" rows={4} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
