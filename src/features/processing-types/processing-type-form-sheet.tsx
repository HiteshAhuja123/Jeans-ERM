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
  processingTypeFormDefaults,
  processingTypeFormSchema,
  type ProcessingTypeFormValues,
} from "@/features/processing-types/schema";
import { processingTypeHooks } from "@/features/processing-types/service";
import { isCodeUnique } from "@/lib/master-data-utils";
import type { ProcessingType } from "@/types";

interface ProcessingTypeFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processingType?: ProcessingType;
  existingProcessingTypes: ProcessingType[];
}

export function ProcessingTypeFormSheet({ open, onOpenChange, processingType, existingProcessingTypes }: ProcessingTypeFormSheetProps) {
  const createMutation = processingTypeHooks.useCreate();
  const updateMutation = processingTypeHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ProcessingTypeFormValues>({
    resolver: zodResolver(processingTypeFormSchema),
    defaultValues: processingTypeFormDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      processingType
        ? { code: processingType.code, name: processingType.name, sequence: processingType.sequence, status: processingType.status }
        : processingTypeFormDefaults,
    );
  }, [open, processingType, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isCodeUnique(existingProcessingTypes, values.code, processingType?.id)) {
      form.setError("code", { message: "A processing type with this code already exists" });
      return;
    }
    try {
      if (processingType) {
        await updateMutation.mutateAsync({ id: processingType.id, patch: values });
        toast.success(`Processing type "${values.name}" updated`);
      } else {
        await createMutation.mutateAsync(values);
        toast.success(`Processing type "${values.name}" added`);
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
      title={processingType ? "Edit Processing Type" : "Add Processing Type"}
      description="Processing types are the washing/finishing steps a batch can go through — configurable since the actual factory process varies."
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
                Code <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. STONE" {...field} />
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
                Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Stone Wash" {...field} />
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
              <FormLabel>Suggested Sequence</FormLabel>
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
