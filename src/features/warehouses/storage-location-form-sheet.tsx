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
  storageLocationFormDefaults,
  storageLocationFormSchema,
  type StorageLocationFormValues,
} from "@/features/warehouses/schema";
import { storageLocationHooks } from "@/features/warehouses/service";
import { isCodeUnique } from "@/lib/master-data-utils";
import type { StorageLocation } from "@/types";

interface StorageLocationFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  warehouseName: string;
  location?: StorageLocation;
  existingLocations: StorageLocation[];
}

export function StorageLocationFormSheet({
  open,
  onOpenChange,
  warehouseId,
  warehouseName,
  location,
  existingLocations,
}: StorageLocationFormSheetProps) {
  const createMutation = storageLocationHooks.useCreate();
  const updateMutation = storageLocationHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<StorageLocationFormValues>({
    resolver: zodResolver(storageLocationFormSchema),
    defaultValues: storageLocationFormDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(location ? { code: location.code, name: location.name, status: location.status } : storageLocationFormDefaults);
  }, [open, location, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isCodeUnique(existingLocations, values.code, location?.id)) {
      form.setError("code", { message: "A location with this code already exists in this warehouse" });
      return;
    }
    try {
      if (location) {
        await updateMutation.mutateAsync({ id: location.id, patch: values });
        toast.success(`Location "${values.name}" updated`);
      } else {
        await createMutation.mutateAsync({ ...values, warehouseId });
        toast.success(`Location "${values.name}" added`);
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
      title={location ? "Edit Storage Location" : "Add Storage Location"}
      description={`A storage area or bin inside ${warehouseName}.`}
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
                Location Code <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. FABRIC-A" {...field} />
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
                Location Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Fabric Area" {...field} />
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
