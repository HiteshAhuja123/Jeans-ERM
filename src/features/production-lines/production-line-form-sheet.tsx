"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EntityFormSheet } from "@/components/shared/entity-form-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  productionLineFormDefaults,
  productionLineFormSchema,
  type ProductionLineFormValues,
} from "@/features/production-lines/schema";
import { productionLineHooks } from "@/features/production-lines/service";
import { isCodeUnique } from "@/lib/master-data-utils";
import { mockDepartments } from "@/mock-data";
import type { ProductionLine } from "@/types";

interface ProductionLineFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionLine?: ProductionLine;
  existingLines: ProductionLine[];
}

export function ProductionLineFormSheet({ open, onOpenChange, productionLine, existingLines }: ProductionLineFormSheetProps) {
  const createMutation = productionLineHooks.useCreate();
  const updateMutation = productionLineHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ProductionLineFormValues>({
    resolver: zodResolver(productionLineFormSchema),
    defaultValues: productionLineFormDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      productionLine
        ? {
            code: productionLine.code,
            name: productionLine.name,
            departmentId: productionLine.departmentId,
            capacity: productionLine.capacity,
            supervisor: productionLine.supervisor,
            status: productionLine.status,
          }
        : productionLineFormDefaults,
    );
  }, [open, productionLine, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isCodeUnique(existingLines, values.code, productionLine?.id)) {
      form.setError("code", { message: "A production line with this code already exists" });
      return;
    }
    const patch = { ...values, supervisor: values.supervisor ?? "" };
    try {
      if (productionLine) {
        await updateMutation.mutateAsync({ id: productionLine.id, patch });
        toast.success(`Production line "${values.name}" updated`);
      } else {
        await createMutation.mutateAsync(patch);
        toast.success(`Production line "${values.name}" added`);
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
      title={productionLine ? "Edit Production Line" : "Add Production Line"}
      description="Production lines belong to a department and host machines."
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
                Line Code <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. CUT-L1" {...field} />
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
                Line Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Cutting Line 1" {...field} />
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
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily Capacity (pcs)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supervisor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supervisor</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Deepak Patil" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
