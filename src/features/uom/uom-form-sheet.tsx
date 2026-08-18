"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EntityFormSheet } from "@/components/shared/entity-form-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uomFormDefaults, uomFormSchema, type UomFormValues } from "@/features/uom/schema";
import { uomHooks } from "@/features/uom/service";
import { isCodeUnique } from "@/lib/master-data-utils";
import type { UnitOfMeasure } from "@/types";

interface UomFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uom?: UnitOfMeasure;
  existingUnits: UnitOfMeasure[];
}

export function UomFormSheet({ open, onOpenChange, uom, existingUnits }: UomFormSheetProps) {
  const createMutation = uomHooks.useCreate();
  const updateMutation = uomHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<UomFormValues>({
    resolver: zodResolver(uomFormSchema),
    defaultValues: uomFormDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(uom ? { code: uom.code, name: uom.name, status: uom.status } : uomFormDefaults);
  }, [open, uom, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isCodeUnique(existingUnits, values.code, uom?.id)) {
      form.setError("code", { message: "A unit with this code already exists" });
      return;
    }
    try {
      if (uom) {
        await updateMutation.mutateAsync({ id: uom.id, patch: values });
        toast.success(`Unit "${values.name}" updated`);
      } else {
        await createMutation.mutateAsync(values);
        toast.success(`Unit "${values.name}" added`);
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
      title={uom ? "Edit Unit of Measurement" : "Add Unit of Measurement"}
      description="Units are configurable and used across materials, purchasing and inventory."
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
                Unit Code <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. KG" {...field} />
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
                Unit Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Kilograms" {...field} />
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
