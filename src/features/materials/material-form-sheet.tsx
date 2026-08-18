"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { EntityFormSheet } from "@/components/shared/entity-form-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { NO_COLOR, NO_SUPPLIER, materialFormDefaults, materialFormSchema, type MaterialFormValues } from "@/features/materials/schema";
import { materialHooks } from "@/features/materials/service";
import { isCodeUnique } from "@/lib/master-data-utils";
import { mockColors, mockMaterialGroups, mockSuppliers, mockUnitsOfMeasure } from "@/mock-data";
import type { Material } from "@/types";

interface MaterialFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: Material;
  existingMaterials: Material[];
}

export function MaterialFormSheet({ open, onOpenChange, material, existingMaterials }: MaterialFormSheetProps) {
  const createMutation = materialHooks.useCreate();
  const updateMutation = materialHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: materialFormDefaults,
  });

  const selectedGroupId = useWatch({ control: form.control, name: "materialGroupId" });
  const selectedGroup = mockMaterialGroups.find((g) => g.id === selectedGroupId);
  const isFabric = selectedGroup?.parentCategory === "fabric";

  useEffect(() => {
    if (!open) return;
    form.reset(
      material
        ? {
            code: material.code,
            name: material.name,
            materialGroupId: material.materialGroupId,
            uomId: material.uomId,
            supplierId: material.supplierId ?? NO_SUPPLIER,
            colorId: material.colorId ?? NO_COLOR,
            description: material.description ?? "",
            composition: material.fabricDetails?.composition ?? "",
            weightOz: material.fabricDetails?.weightOz,
            widthCm: material.fabricDetails?.widthCm,
            stretch: material.fabricDetails?.stretch ?? false,
            status: material.status,
          }
        : materialFormDefaults,
    );
  }, [open, material, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isCodeUnique(existingMaterials, values.code, material?.id)) {
      form.setError("code", { message: "A material with this code already exists" });
      return;
    }
    const patch = {
      code: values.code,
      name: values.name,
      materialGroupId: values.materialGroupId,
      uomId: values.uomId,
      supplierId: values.supplierId === NO_SUPPLIER ? undefined : values.supplierId,
      colorId: values.colorId === NO_COLOR ? undefined : values.colorId,
      description: values.description,
      status: values.status,
      fabricDetails: isFabric
        ? {
            composition: values.composition ?? "",
            weightOz: values.weightOz,
            widthCm: values.widthCm ?? 0,
            stretch: values.stretch,
          }
        : undefined,
    };
    try {
      if (material) {
        await updateMutation.mutateAsync({ id: material.id, patch });
        toast.success(`Material "${values.name}" updated`);
      } else {
        await createMutation.mutateAsync(patch);
        toast.success(`Material "${values.name}" added`);
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
      title={material ? "Edit Material" : "Add Material"}
      description="Covers fabric, accessories, thread, labels and packaging — pick a group to tailor the fields."
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
                Material Code <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. FAB-DBL-11" {...field} />
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
                Material Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Denim Blue 11 OZ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="materialGroupId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Material Group <span className="text-destructive">*</span>
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mockMaterialGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
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
          name="uomId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Unit <span className="text-destructive">*</span>
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mockUnitsOfMeasure.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
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
          name="supplierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Supplier</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_SUPPLIER}>Not set</SelectItem>
                  {mockSuppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Short note on usage" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isFabric && (
          <>
            <Separator />
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Fabric Details</p>
            <FormField
              control={form.control}
              name="composition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Composition</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 98% Cotton, 2% Elastane" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="weightOz"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (OZ)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={0.1} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="widthCm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Width (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="colorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_COLOR}>Not set</SelectItem>
                      {mockColors.map((color) => (
                        <SelectItem key={color.id} value={color.id}>
                          {color.name}
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
              name="stretch"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                  <FormLabel className="cursor-pointer">Stretch fabric</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
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
