"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { EntityFormSheet } from "@/components/shared/entity-form-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { skuFormDefaults, skuFormSchema, type SkuFormValues } from "@/features/skus/schema";
import { skuHooks } from "@/features/skus/service";
import { isSkuComboUnique } from "@/lib/master-data-utils";
import { mockColors, mockSizes, mockStyles } from "@/mock-data";
import type { Sku } from "@/types";

interface SkuFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sku?: Sku;
  existingSkus: Sku[];
}

export function SkuFormSheet({ open, onOpenChange, sku, existingSkus }: SkuFormSheetProps) {
  const createMutation = skuHooks.useCreate();
  const updateMutation = skuHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<SkuFormValues>({
    resolver: zodResolver(skuFormSchema),
    defaultValues: skuFormDefaults,
  });

  const [styleId, colorId, sizeId] = useWatch({ control: form.control, name: ["styleId", "colorId", "sizeId"] });
  const style = mockStyles.find((s) => s.id === styleId);
  const color = mockColors.find((c) => c.id === colorId);
  const size = mockSizes.find((s) => s.id === sizeId);
  const previewCode = style && color && size ? `${style.styleCode}-${color.code}-${size.code}` : null;

  useEffect(() => {
    if (!open) return;
    form.reset(sku ? { styleId: sku.styleId, colorId: sku.colorId, sizeId: sku.sizeId, status: sku.status } : skuFormDefaults);
  }, [open, sku, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isSkuComboUnique(existingSkus, values.styleId, values.colorId, values.sizeId, sku?.id)) {
      form.setError("sizeId", { message: "This style, color and size combination already exists" });
      return;
    }
    const skuCode = `${style?.styleCode}-${color?.code}-${size?.code}`;
    const patch = { ...values, skuCode };
    try {
      if (sku) {
        await updateMutation.mutateAsync({ id: sku.id, patch });
        toast.success(`SKU "${skuCode}" updated`);
      } else {
        await createMutation.mutateAsync(patch);
        toast.success(`SKU "${skuCode}" added`);
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
      title={sku ? "Edit SKU" : "Add SKU"}
      description="A SKU is a unique Style + Color + Size combination."
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="styleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Style <span className="text-destructive">*</span>
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a style" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mockStyles.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.styleCode} — {s.name}
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
          name="colorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Color <span className="text-destructive">*</span>
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mockColors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
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
          name="sizeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Size <span className="text-destructive">*</span>
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a size" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mockSizes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {previewCode && (
          <div className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">SKU code: </span>
            <span className="font-medium text-foreground">{previewCode}</span>
          </div>
        )}
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
