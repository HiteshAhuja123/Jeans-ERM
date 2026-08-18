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
  supplierFormDefaults,
  supplierFormSchema,
  supplierTypeToCategory,
  type SupplierFormValues,
} from "@/features/suppliers/schema";
import { supplierHooks } from "@/features/suppliers/service";
import { isCodeUnique } from "@/lib/master-data-utils";
import type { Supplier } from "@/types";

interface SupplierFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier;
  existingSuppliers: Supplier[];
}

const typeOptions: Array<{ value: SupplierFormValues["type"]; label: string }> = [
  { value: "fabric", label: "Fabric Supplier" },
  { value: "accessories", label: "Accessories Supplier" },
  { value: "packaging", label: "Packaging Supplier" },
  { value: "washing_vendor", label: "Washing Vendor" },
  { value: "processing_vendor", label: "Processing Vendor" },
  { value: "other", label: "Other" },
];

export function SupplierFormSheet({ open, onOpenChange, supplier, existingSuppliers }: SupplierFormSheetProps) {
  const createMutation = supplierHooks.useCreate();
  const updateMutation = supplierHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: supplierFormDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      supplier
        ? {
            code: supplier.code,
            name: supplier.name,
            type: supplier.type,
            contactPerson: supplier.contactPerson,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address,
            location: supplier.location,
            status: supplier.status,
            notes: supplier.notes ?? "",
          }
        : supplierFormDefaults,
    );
  }, [open, supplier, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isCodeUnique(existingSuppliers, values.code, supplier?.id)) {
      form.setError("code", { message: "A supplier with this code already exists" });
      return;
    }
    const patch = {
      ...values,
      category: supplierTypeToCategory[values.type],
      rating: supplier?.rating ?? 0,
      activeOrders: supplier?.activeOrders ?? 0,
      onTimeDeliveryRate: supplier?.onTimeDeliveryRate ?? 0,
    };
    try {
      if (supplier) {
        await updateMutation.mutateAsync({ id: supplier.id, patch });
        toast.success(`Supplier "${values.name}" updated`);
      } else {
        await createMutation.mutateAsync(patch);
        toast.success(`Supplier "${values.name}" added`);
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
      title={supplier ? "Edit Supplier" : "Add Supplier"}
      description="Fabric, accessories, packaging, washing and processing vendors."
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    >
      <Form {...form}>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Supplier Code <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g. SUP-005" {...field} />
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
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Supplier Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Vardhman Denim Mills" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Contact Person <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Gurpreet Singh" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Email <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="email" placeholder="name@company.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Phone <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="+91 161 500 3421" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input placeholder="Street, industrial area" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                City / Location <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Ludhiana, India" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Anything the team should know about this supplier" {...field} />
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
