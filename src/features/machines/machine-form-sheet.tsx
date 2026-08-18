"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EntityFormSheet } from "@/components/shared/entity-form-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NO_PRODUCTION_LINE, machineFormDefaults, machineFormSchema, type MachineFormValues } from "@/features/machines/schema";
import { machineHooks } from "@/features/machines/service";
import { isCodeUnique } from "@/lib/master-data-utils";
import { mockDepartments, mockProductionLineMasters } from "@/mock-data";
import type { Machine } from "@/types";

interface MachineFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine?: Machine;
  existingMachines: Machine[];
}

const statusOptions: Array<{ value: MachineFormValues["status"]; label: string }> = [
  { value: "available", label: "Available" },
  { value: "running", label: "Running" },
  { value: "maintenance", label: "Maintenance" },
  { value: "inactive", label: "Inactive" },
];

export function MachineFormSheet({ open, onOpenChange, machine, existingMachines }: MachineFormSheetProps) {
  const createMutation = machineHooks.useCreate();
  const updateMutation = machineHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<MachineFormValues>({
    resolver: zodResolver(machineFormSchema),
    defaultValues: machineFormDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      machine
        ? {
            code: machine.code,
            name: machine.name,
            machineType: machine.machineType,
            departmentId: machine.departmentId,
            productionLineId: machine.productionLineId ?? NO_PRODUCTION_LINE,
            status: machine.status,
          }
        : machineFormDefaults,
    );
  }, [open, machine, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isCodeUnique(existingMachines, values.code, machine?.id)) {
      form.setError("code", { message: "A machine with this code already exists" });
      return;
    }
    const patch = {
      ...values,
      productionLineId: values.productionLineId === NO_PRODUCTION_LINE ? undefined : values.productionLineId,
    };
    try {
      if (machine) {
        await updateMutation.mutateAsync({ id: machine.id, patch });
        toast.success(`Machine "${values.name}" updated`);
      } else {
        await createMutation.mutateAsync(patch);
        toast.success(`Machine "${values.name}" added`);
      }
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <EntityFormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={machine ? "Edit Machine" : "Add Machine"}
      description="Machines belong to a department and, optionally, a specific production line."
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Machine Code <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. CUT-M01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Machine Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Auto Fabric Cutter 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="machineType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Machine Type <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Cutting Machine" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="departmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Department <span className="text-destructive">*</span>
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mockDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
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
          name="productionLineId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Production Line</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_PRODUCTION_LINE}>Not assigned</SelectItem>
                  {mockProductionLineMasters.map((line) => (
                    <SelectItem key={line.id} value={line.id}>
                      {line.name}
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((option) => (
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
      </Form>
    </EntityFormSheet>
  );
}
