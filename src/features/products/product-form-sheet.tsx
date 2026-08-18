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
import { productFormDefaults, productFormSchema, type ProductFormValues } from "@/features/products/schema";
import { productHooks } from "@/features/products/service";
import { isCodeUnique } from "@/lib/master-data-utils";
import type { Product } from "@/types";

interface ProductFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  existingProducts: Product[];
}

export function ProductFormSheet({ open, onOpenChange, product, existingProducts }: ProductFormSheetProps) {
  const createMutation = productHooks.useCreate();
  const updateMutation = productHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: productFormDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      product
        ? {
            code: product.code,
            name: product.name,
            category: product.category,
            description: product.description ?? "",
            status: product.status,
          }
        : productFormDefaults,
    );
  }, [open, product, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isCodeUnique(existingProducts, values.code, product?.id)) {
      form.setError("code", { message: "A product with this code already exists" });
      return;
    }
    try {
      if (product) {
        await updateMutation.mutateAsync({ id: product.id, patch: values });
        toast.success(`Product "${values.name}" updated`);
      } else {
        await createMutation.mutateAsync(values);
        toast.success(`Product "${values.name}" added`);
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
      title={product ? "Edit Product" : "Add Product"}
      description="The finished-jeans product line — styles and SKUs are defined underneath it."
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
                Product Code <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. MENS-SLIM" {...field} />
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
                Product Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Men's Slim Fit Jeans" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Category <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Men's Denim" {...field} />
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
                <Textarea placeholder="Short description of this product line" {...field} />
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
