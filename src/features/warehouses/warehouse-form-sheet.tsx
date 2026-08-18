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
import { warehouseFormDefaults, warehouseFormSchema, type WarehouseFormValues } from "@/features/warehouses/schema";
import { warehouseHooks } from "@/features/warehouses/service";
import { isCodeUnique } from "@/lib/master-data-utils";
import type { Warehouse } from "@/types";

interface WarehouseFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: Warehouse;
  existingWarehouses: Warehouse[];
}

const typeOptions: Array<{ value: WarehouseFormValues["type"]; label: string }> = [
  { value: "raw_material", label: "Raw Material" },
  { value: "finished_goods", label: "Finished Goods" },
  { value: "general", label: "General" },
];

export function WarehouseFormSheet({ open, onOpenChange, warehouse, existingWarehouses }: WarehouseFormSheetProps) {
  const createMutation = warehouseHooks.useCreate();
  const updateMutation = warehouseHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: warehouseFormDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      warehouse
        ? {
            code: warehouse.code,
            name: warehouse.name,
            type: warehouse.type,
            address: warehouse.address ?? "",
            status: warehouse.status,
          }
        : warehouseFormDefaults,
    );
  }, [open, warehouse, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isCodeUnique(existingWarehouses, values.code, warehouse?.id)) {
      form.setError("code", { message: "A warehouse with this code already exists" });
      return;
    }
    try {
      if (warehouse) {
        await updateMutation.mutateAsync({ id: warehouse.id, patch: values });
        toast.success(`Warehouse "${values.name}" updated`);
      } else {
        await createMutation.mutateAsync(values);
        toast.success(`Warehouse "${values.name}" added`);
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
      title={warehouse ? "Edit Warehouse" : "Add Warehouse"}
      description="Warehouses group storage locations for raw materials, finished goods and general stock."
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
                Warehouse Code <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. RAW-01" {...field} />
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
                Warehouse Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Raw Material Warehouse" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {typeOptions.map((option) => (
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
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea placeholder="Street, area, city" {...field} />
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
