"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { EntityFormSheet } from "@/components/shared/entity-form-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  purchaseRequestFormDefaults,
  purchaseRequestFormSchema,
  type PurchaseRequestFormValues,
} from "@/features/purchasing/schema";
import { purchaseRequestHooks } from "@/features/purchasing/service";
import { materialHooks } from "@/features/materials/service";
import { supplierHooks } from "@/features/suppliers/service";
import { generatePrNumber } from "@/lib/purchasing-utils";
import { currentUser } from "@/mock-data/users";
import { mockUnitsOfMeasure } from "@/mock-data";

interface PurchaseRequestFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: { materialId?: string; quantity?: number };
}

export function PurchaseRequestFormSheet({ open, onOpenChange, prefill }: PurchaseRequestFormSheetProps) {
  const { data: materials = [] } = materialHooks.useList();
  const { data: suppliers = [] } = supplierHooks.useList();
  const { data: existingRequests = [] } = purchaseRequestHooks.useList();
  const createMutation = purchaseRequestHooks.useCreate();

  const form = useForm<PurchaseRequestFormValues>({
    resolver: zodResolver(purchaseRequestFormSchema),
    defaultValues: purchaseRequestFormDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      ...purchaseRequestFormDefaults,
      materialId: prefill?.materialId ?? "",
      quantity: prefill?.quantity ?? 0,
    });
  }, [open, prefill, form]);

  const materialId = useWatch({ control: form.control, name: "materialId" });
  const selectedMaterial = materials.find((m) => m.id === materialId);
  const unit = selectedMaterial ? mockUnitsOfMeasure.find((u) => u.id === selectedMaterial.uomId)?.code ?? "" : "";

  const onSubmit = form.handleSubmit(async (values) => {
    const material = materials.find((m) => m.id === values.materialId);
    if (!material) {
      form.setError("materialId", { message: "Select a material" });
      return;
    }
    try {
      const requestNumber = generatePrNumber(existingRequests);
      await createMutation.mutateAsync({
        requestNumber,
        requestedBy: currentUser.name,
        materialId: material.id,
        materialCode: material.code,
        materialName: material.name,
        quantity: values.quantity,
        unit: mockUnitsOfMeasure.find((u) => u.id === material.uomId)?.code ?? "",
        requiredDate: values.requiredDate,
        requestDate: new Date().toISOString().slice(0, 10),
        preferredSupplierId: values.preferredSupplierId || undefined,
        priority: values.priority,
        reason: values.reason,
        notes: values.notes || undefined,
        status: "submitted",
      });
      toast.success(`Purchase request ${requestNumber} submitted`);
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <EntityFormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="New Purchase Request"
      description="Flag a material that needs to be purchased — this isn't a Purchase Order yet."
      onSubmit={onSubmit}
      isSubmitting={createMutation.isPending}
      submitLabel="Submit Request"
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="materialId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Material <span className="text-destructive">*</span>
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {materials
                    .filter((m) => m.status === "active")
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.code} — {m.name}
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
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Quantity {unit ? `(${unit})` : ""} <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input type="number" min={0} inputMode="numeric" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requiredDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Required By <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="preferredSupplierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Supplier</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No preference" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {suppliers
                    .filter((s) => s.status === "active")
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
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
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Reason <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Textarea placeholder="e.g. Production requirement, low stock replenishment…" rows={2} {...field} />
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
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </EntityFormSheet>
  );
}
