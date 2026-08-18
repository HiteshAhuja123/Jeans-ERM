"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EntityFormSheet } from "@/components/shared/entity-form-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NO_DEPARTMENT, processFormDefaults, processFormSchema, type ProcessFormValues } from "@/features/processes/schema";
import { processHooks } from "@/features/processes/service";
import { isCodeUnique } from "@/lib/master-data-utils";
import { mockDepartments } from "@/mock-data";
import type { Process } from "@/types";

interface ProcessFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  process?: Process;
  existingProcesses: Process[];
}

export function ProcessFormSheet({ open, onOpenChange, process, existingProcesses }: ProcessFormSheetProps) {
  const createMutation = processHooks.useCreate();
  const updateMutation = processHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ProcessFormValues>({
    resolver: zodResolver(processFormSchema),
    defaultValues: processFormDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      process
        ? {
            code: process.code,
            name: process.name,
            sequence: process.sequence,
            departmentId: process.departmentId ?? NO_DEPARTMENT,
            status: process.status,
          }
        : processFormDefaults,
    );
  }, [open, process, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isCodeUnique(existingProcesses, values.code, process?.id)) {
      form.setError("code", { message: "A process with this code already exists" });
      return;
    }
    const patch = {
      ...values,
      departmentId: values.departmentId === NO_DEPARTMENT ? undefined : values.departmentId,
    };
    try {
      if (process) {
        await updateMutation.mutateAsync({ id: process.id, patch });
        toast.success(`Process "${values.name}" updated`);
      } else {
        await createMutation.mutateAsync(patch);
        toast.success(`Process "${values.name}" added`);
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
      title={process ? "Edit Process" : "Add Process"}
      description="Processes are configurable operations — the workflow they form isn't hardcoded."
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
                Process Code <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. QC" {...field} />
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
                Process Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Quality Check" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sequence"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Suggested Sequence</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
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
              <FormLabel>Department</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_DEPARTMENT}>Not linked</SelectItem>
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
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
