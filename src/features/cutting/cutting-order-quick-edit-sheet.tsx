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
import { cuttingOrderQuickEditSchema, type CuttingOrderQuickEditValues } from "@/features/cutting/schema";
import { cuttingOrderHooks } from "@/features/cutting/service";
import { employeeHooks } from "@/features/employees/service";
import { machineHooks } from "@/features/machines/service";
import type { CuttingOrder } from "@/types";

function valuesFromOrder(order: CuttingOrder): CuttingOrderQuickEditValues {
  return {
    supervisor: order.supervisor ?? "",
    machineId: order.machineId ?? "",
    plannedStart: order.plannedStart ?? "",
    plannedEnd: order.plannedEnd ?? "",
    notes: order.notes ?? "",
  };
}

export function CuttingOrderQuickEditSheet({
  open,
  onOpenChange,
  cuttingOrder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cuttingOrder: CuttingOrder;
}) {
  const { data: employees = [] } = employeeHooks.useList();
  const { data: machines = [] } = machineHooks.useList();
  const updateMutation = cuttingOrderHooks.useUpdate();

  const form = useForm<CuttingOrderQuickEditValues>({
    resolver: zodResolver(cuttingOrderQuickEditSchema),
    defaultValues: valuesFromOrder(cuttingOrder),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(valuesFromOrder(cuttingOrder));
  }, [open, cuttingOrder, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        id: cuttingOrder.id,
        patch: {
          supervisor: values.supervisor || undefined,
          machineId: values.machineId || undefined,
          plannedStart: values.plannedStart || undefined,
          plannedEnd: values.plannedEnd || undefined,
          notes: values.notes || undefined,
        },
      });
      toast.success(`${cuttingOrder.cuttingOrderNumber} updated`);
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <EntityFormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Update Cutting Order"
      description="Adjust the supervisor, machine, schedule and notes."
      onSubmit={onSubmit}
      isSubmitting={updateMutation.isPending}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="supervisor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cutting Supervisor</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {employees
                    .filter((e) => e.status === "active")
                    .map((e) => (
                      <SelectItem key={e.id} value={e.name}>
                        {e.name} — {e.designation}
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
          name="machineId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Machine</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {machines
                    .filter((m) => m.machineType.toLowerCase().includes("cutting"))
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
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
