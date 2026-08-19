"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { EntityFormSheet } from "@/components/shared/entity-form-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  stockAdjustmentDefaults,
  stockAdjustmentSchema,
  type StockAdjustmentValues,
} from "@/features/inventory/schema";
import { inventoryHooks } from "@/features/inventory/service";
import { storageLocationHooks, warehouseHooks } from "@/features/warehouses/service";
import { currentUser } from "@/mock-data/users";
import type { InventoryBalance } from "@/types";

interface StockAdjustmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: string;
  materialName: string;
  unit: string;
  balance: InventoryBalance;
}

export function StockAdjustmentSheet({
  open,
  onOpenChange,
  materialId,
  materialName,
  unit,
  balance,
}: StockAdjustmentSheetProps) {
  const { data: warehouses = [] } = warehouseHooks.useList();
  const { data: locations = [] } = storageLocationHooks.useList();
  const adjustMutation = inventoryHooks.useAdjustStock();

  const form = useForm<StockAdjustmentValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: stockAdjustmentDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(stockAdjustmentDefaults);
  }, [open, form]);

  const warehouseId = useWatch({ control: form.control, name: "warehouseId" });
  const locationId = useWatch({ control: form.control, name: "locationId" });
  const physicalQuantity = useWatch({ control: form.control, name: "physicalQuantity" });

  const locationOptions = useMemo(
    () => locations.filter((loc) => loc.status === "active" && loc.warehouseId === warehouseId),
    [locations, warehouseId],
  );

  const systemQuantity =
    balance.locations.find((loc) => loc.warehouseId === warehouseId && loc.locationId === locationId)?.quantity ?? 0;
  const delta = (Number(physicalQuantity) || 0) - systemQuantity;

  const onSubmit = form.handleSubmit(async (values) => {
    const adjustmentDelta = values.physicalQuantity - systemQuantity;
    if (adjustmentDelta === 0) {
      form.setError("physicalQuantity", { message: "This matches the system count — no adjustment needed" });
      return;
    }
    try {
      await adjustMutation.mutateAsync({
        materialId,
        materialName,
        warehouseId: values.warehouseId,
        locationId: values.locationId,
        delta: adjustmentDelta,
        unit,
        reason: values.reason,
        performedBy: currentUser.name,
      });
      toast.success(`Stock adjusted by ${adjustmentDelta > 0 ? "+" : ""}${adjustmentDelta.toLocaleString()} ${unit}`);
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <EntityFormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Adjust Stock"
      description={`Correct the recorded quantity of ${materialName} after a physical count — always logged as a stock movement.`}
      onSubmit={onSubmit}
      isSubmitting={adjustMutation.isPending}
      submitLabel="Save Adjustment"
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="warehouseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Warehouse</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("locationId", "");
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {warehouses
                    .filter((w) => w.status === "active")
                    .map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
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
          name="locationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={!warehouseId}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {locationOptions.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {warehouseId && locationId && (
          <p className="text-sm text-muted-foreground">
            System stock at this location: <span className="font-medium text-foreground">{systemQuantity.toLocaleString()} {unit}</span>
          </p>
        )}

        <FormField
          control={form.control}
          name="physicalQuantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Physical Count ({unit}) <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input type="number" min={0} inputMode="numeric" {...field} />
              </FormControl>
              {warehouseId && locationId && (
                <p className={`text-xs font-medium ${delta === 0 ? "text-muted-foreground" : delta > 0 ? "text-success" : "text-critical"}`}>
                  Adjustment: {delta > 0 ? "+" : ""}
                  {delta.toLocaleString()} {unit}
                </p>
              )}
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
                <Textarea placeholder="e.g. Physical count discrepancy" rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </EntityFormSheet>
  );
}
