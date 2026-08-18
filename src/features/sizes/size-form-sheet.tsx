"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EntityFormSheet } from "@/components/shared/entity-form-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sizeFormDefaults, sizeFormSchema, type SizeFormValues } from "@/features/sizes/schema";
import { sizeHooks } from "@/features/sizes/service";
import { isCodeUnique } from "@/lib/master-data-utils";
import type { Size } from "@/types";

interface SizeFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: Size;
  existingSizes: Size[];
}

export function SizeFormSheet({ open, onOpenChange, size, existingSizes }: SizeFormSheetProps) {
  const createMutation = sizeHooks.useCreate();
  const updateMutation = sizeHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<SizeFormValues>({
    resolver: zodResolver(sizeFormSchema),
    defaultValues: sizeFormDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      size
        ? { code: size.code, displayName: size.displayName, sequence: size.sequence, status: size.status }
        : sizeFormDefaults,
    );
  }, [open, size, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isCodeUnique(existingSizes, values.code, size?.id)) {
      form.setError("code", { message: "A size with this code already exists" });
      return;
    }
    try {
      if (size) {
        await updateMutation.mutateAsync({ id: size.id, patch: values });
        toast.success(`Size "${values.displayName}" updated`);
      } else {
        await createMutation.mutateAsync(values);
        toast.success(`Size "${values.displayName}" added`);
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
      title={size ? "Edit Size" : "Add Size"}
      description="Sizes are configurable — add, rename or retire values as your size range changes."
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
                Size Code <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. 32" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Display Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. 32" {...field} />
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
              <FormLabel>Sort Sequence</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
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
