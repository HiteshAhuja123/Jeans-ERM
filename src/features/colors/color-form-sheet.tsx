"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EntityFormSheet } from "@/components/shared/entity-form-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { colorFormDefaults, colorFormSchema, type ColorFormValues } from "@/features/colors/schema";
import { colorHooks } from "@/features/colors/service";
import { isCodeUnique } from "@/lib/master-data-utils";
import type { Color } from "@/types";

interface ColorFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  color?: Color;
  existingColors: Color[];
}

export function ColorFormSheet({ open, onOpenChange, color, existingColors }: ColorFormSheetProps) {
  const createMutation = colorHooks.useCreate();
  const updateMutation = colorHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ColorFormValues>({
    resolver: zodResolver(colorFormSchema),
    defaultValues: colorFormDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      color ? { code: color.code, name: color.name, hex: color.hex, status: color.status } : colorFormDefaults,
    );
  }, [open, color, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isCodeUnique(existingColors, values.code, color?.id)) {
      form.setError("code", { message: "A color with this code already exists" });
      return;
    }
    try {
      if (color) {
        await updateMutation.mutateAsync({ id: color.id, patch: values });
        toast.success(`Color "${values.name}" updated`);
      } else {
        await createMutation.mutateAsync(values);
        toast.success(`Color "${values.name}" added`);
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
      title={color ? "Edit Color" : "Add Color"}
      description="Colors are configurable and drive SKU combinations."
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
                Color Code <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. IND" {...field} />
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
                Color Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Indigo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hex"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Color</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <input
                    type="color"
                    value={field.value}
                    onChange={field.onChange}
                    className="h-8 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
                    aria-label="Pick display color"
                  />
                </FormControl>
                <Input value={field.value} onChange={field.onChange} className="flex-1" />
              </div>
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
