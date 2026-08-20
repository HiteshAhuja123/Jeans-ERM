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
  sewingOperationFormDefaults,
  sewingOperationFormSchema,
  type SewingOperationFormValues,
} from "@/features/sewing-operations/schema";
import { sewingOperationHooks } from "@/features/sewing-operations/service";
import { isCodeUnique } from "@/lib/master-data-utils";
import type { SewingOperation } from "@/types";

interface OperationFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation?: SewingOperation;
  existingOperations: SewingOperation[];
}

export function OperationFormSheet({ open, onOpenChange, operation, existingOperations }: OperationFormSheetProps) {
  const createMutation = sewingOperationHooks.useCreate();
  const updateMutation = sewingOperationHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<SewingOperationFormValues>({
    resolver: zodResolver(sewingOperationFormSchema),
    defaultValues: sewingOperationFormDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      operation
        ? { code: operation.code, name: operation.name, sequence: operation.sequence, status: operation.status }
        : sewingOperationFormDefaults,
    );
  }, [open, operation, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isCodeUnique(existingOperations, values.code, operation?.id)) {
      form.setError("code", { message: "An operation with this code already exists" });
      return;
    }
    try {
      if (operation) {
        await updateMutation.mutateAsync({ id: operation.id, patch: values });
        toast.success(`Operation "${values.name}" updated`);
      } else {
        await createMutation.mutateAsync(values);
        toast.success(`Operation "${values.name}" added`);
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
      title={operation ? "Edit Operation" : "Add Operation"}
      description="Operations are the steps a garment moves through on the sewing line — the sequence is a suggestion, not a fixed workflow."
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
                Operation Code <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. HEM" {...field} />
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
                Operation Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Hem" {...field} />
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
