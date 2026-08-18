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
  departmentFormDefaults,
  departmentFormSchema,
  type DepartmentFormValues,
} from "@/features/departments/schema";
import { departmentHooks } from "@/features/departments/service";
import { isCodeUnique } from "@/lib/master-data-utils";
import type { Department } from "@/types";

interface DepartmentFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department;
  existingDepartments: Department[];
}

export function DepartmentFormSheet({
  open,
  onOpenChange,
  department,
  existingDepartments,
}: DepartmentFormSheetProps) {
  const createMutation = departmentHooks.useCreate();
  const updateMutation = departmentHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: departmentFormDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      department
        ? {
            code: department.code,
            name: department.name,
            description: department.description ?? "",
            status: department.status,
          }
        : departmentFormDefaults,
    );
  }, [open, department, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isCodeUnique(existingDepartments, values.code, department?.id)) {
      form.setError("code", { message: "A department with this code already exists" });
      return;
    }
    try {
      if (department) {
        await updateMutation.mutateAsync({ id: department.id, patch: values });
        toast.success(`Department "${values.name}" updated`);
      } else {
        await createMutation.mutateAsync(values);
        toast.success(`Department "${values.name}" added`);
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
      title={department ? "Edit Department" : "Add Department"}
      description="Departments group production lines, machines and employees."
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
                Department Code <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. CUT" {...field} />
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
                Department Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Cutting" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="What this department is responsible for" {...field} />
              </FormControl>
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
