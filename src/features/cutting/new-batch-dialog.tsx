"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateCuttingBatchNumber } from "@/lib/cutting-utils";
import { newCuttingBatchSchema, type NewCuttingBatchValues } from "@/features/cutting/schema";
import { cuttingBatchActionHooks, cuttingBatchHooks } from "@/features/cutting/service";
import { employeeHooks } from "@/features/employees/service";
import { machineHooks } from "@/features/machines/service";
import type { CuttingOrder, CuttingPlan } from "@/types";

export function NewBatchDialog({
  open,
  onOpenChange,
  cuttingPlan,
  cuttingOrder,
  maxPlannable,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cuttingPlan: CuttingPlan;
  cuttingOrder: CuttingOrder;
  maxPlannable: number;
}) {
  const { data: employees = [] } = employeeHooks.useList();
  const { data: machines = [] } = machineHooks.useList();
  const { data: existingBatches = [] } = cuttingBatchHooks.useList();
  const createMutation = cuttingBatchActionHooks.useCreate();

  const form = useForm<NewCuttingBatchValues>({
    resolver: zodResolver(newCuttingBatchSchema),
    values: {
      plannedQuantity: maxPlannable,
      maxPlannable,
      supervisor: cuttingOrder.supervisor ?? "",
      operator: "",
      machineId: cuttingOrder.machineId,
      plannedStart: cuttingOrder.plannedStart,
      plannedEnd: cuttingOrder.plannedEnd,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const batchNumber = generateCuttingBatchNumber(existingBatches);
      await createMutation.mutateAsync({
        batchNumber,
        cuttingPlan,
        cuttingOrder,
        plannedQuantity: values.plannedQuantity,
        supervisor: values.supervisor || undefined,
        operator: values.operator || undefined,
        machineId: values.machineId,
        plannedStart: values.plannedStart || undefined,
        plannedEnd: values.plannedEnd || undefined,
      });
      toast.success(`${batchNumber} created`);
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Cutting Batch</DialogTitle>
          <DialogDescription>
            {maxPlannable.toLocaleString()} pcs of {cuttingOrder.requiredQuantity.toLocaleString()} still unplanned for
            {" "}
            {cuttingOrder.cuttingOrderNumber}. Split cutting into another batch.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="new-batch-form" onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="plannedQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Planned Quantity (pcs)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={maxPlannable} inputMode="numeric" {...field} />
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
              name="supervisor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supervisor</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select supervisor" />
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
              name="operator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operator</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Manoj Kumar" {...field} />
                  </FormControl>
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
                        <SelectValue placeholder="Select machine" />
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
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="new-batch-form" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating…" : "Create Batch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
