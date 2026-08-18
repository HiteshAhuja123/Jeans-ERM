"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EntityFormSheet } from "@/components/shared/entity-form-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { styleFormDefaults, styleFormSchema, type StyleFormValues } from "@/features/styles/schema";
import { styleHooks } from "@/features/styles/service";
import { isCodeUnique } from "@/lib/master-data-utils";
import { cn } from "@/lib/utils";
import { mockProcesses, mockProducts } from "@/mock-data";
import type { Style } from "@/types";

interface StyleFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  style?: Style;
  existingStyles: Style[];
}

const genderOptions: Array<{ value: StyleFormValues["gender"]; label: string }> = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "unisex", label: "Unisex" },
  { value: "kids", label: "Kids" },
];

export function StyleFormSheet({ open, onOpenChange, style, existingStyles }: StyleFormSheetProps) {
  const createMutation = styleHooks.useCreate();
  const updateMutation = styleHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<StyleFormValues>({
    resolver: zodResolver(styleFormSchema),
    defaultValues: styleFormDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      style
        ? {
            styleCode: style.styleCode,
            name: style.name,
            productId: style.productId,
            category: style.category,
            gender: style.gender,
            fit: style.fit,
            fabricType: style.fabricType,
            defaultOperationIds: style.defaultOperationIds,
            status: style.status,
          }
        : styleFormDefaults,
    );
  }, [open, style, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isCodeUnique(existingStyles.map((s) => ({ id: s.id, code: s.styleCode })), values.styleCode, style?.id)) {
      form.setError("styleCode", { message: "A style with this code already exists" });
      return;
    }
    try {
      if (style) {
        await updateMutation.mutateAsync({ id: style.id, patch: values });
        toast.success(`Style "${values.name}" updated`);
      } else {
        await createMutation.mutateAsync(values);
        toast.success(`Style "${values.name}" added`);
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
      title={style ? "Edit Style" : "Add Style"}
      description="A style defines fit, fabric and default operations for a product line."
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="styleCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Style Code <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. SLIM-502" {...field} />
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
                Style Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Slim 502" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Product <span className="text-destructive">*</span>
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mockProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
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
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Men's Denim" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {genderOptions.map((option) => (
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
          name="fit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Fit <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Slim, Straight, Skinny" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fabricType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Fabric Type <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Stretch Denim 9.5 OZ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="defaultOperationIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Operations</FormLabel>
              <div className="flex flex-wrap gap-1.5">
                {mockProcesses
                  .filter((p) => p.status === "active")
                  .map((process) => {
                    const selected = field.value.includes(process.id);
                    return (
                      <button
                        key={process.id}
                        type="button"
                        onClick={() =>
                          field.onChange(
                            selected
                              ? field.value.filter((id: string) => id !== process.id)
                              : [...field.value, process.id],
                          )
                        }
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-transparent text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {process.name}
                      </button>
                    );
                  })}
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
