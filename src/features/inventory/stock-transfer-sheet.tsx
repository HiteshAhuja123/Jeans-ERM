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
import { stockTransferDefaults, stockTransferSchema, type StockTransferValues } from "@/features/inventory/schema";
import { inventoryHooks } from "@/features/inventory/service";
import { storageLocationHooks, warehouseHooks } from "@/features/warehouses/service";
import { currentUser } from "@/mock-data/users";
import type { InventoryBalance } from "@/types";

interface StockTransferSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: string;
  materialName: string;
  unit: string;
  balance: InventoryBalance;
}

export function StockTransferSheet({ open, onOpenChange, materialId, materialName, unit, balance }: StockTransferSheetProps) {
  const { data: warehouses = [] } = warehouseHooks.useList();
  const { data: locations = [] } = storageLocationHooks.useList();
  const transferMutation = inventoryHooks.useTransferStock();

  const form = useForm<StockTransferValues>({
    resolver: zodResolver(stockTransferSchema),
    defaultValues: stockTransferDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(stockTransferDefaults);
  }, [open, form]);

  const fromWarehouseId = useWatch({ control: form.control, name: "fromWarehouseId" });
  const toWarehouseId = useWatch({ control: form.control, name: "toWarehouseId" });
  const fromLocationId = useWatch({ control: form.control, name: "fromLocationId" });

  const sourceOptions = useMemo(
    () =>
      balance.locations
        .filter((loc) => loc.quantity > 0)
        .map((loc) => ({
          ...loc,
          warehouseName: warehouses.find((w) => w.id === loc.warehouseId)?.name ?? "—",
          locationName: locations.find((l) => l.id === loc.locationId)?.name ?? "—",
        })),
    [balance.locations, warehouses, locations],
  );

  const destinationLocations = useMemo(
    () => locations.filter((loc) => loc.status === "active" && loc.warehouseId === toWarehouseId),
    [locations, toWarehouseId],
  );

  const selectedSource = sourceOptions.find(
    (opt) => opt.warehouseId === fromWarehouseId && opt.locationId === fromLocationId,
  );

  const onSubmit = form.handleSubmit(async (values) => {
    if (selectedSource && values.quantity > selectedSource.quantity) {
      form.setError("quantity", {
        message: `Only ${selectedSource.quantity.toLocaleString()} ${unit} available at the source location`,
      });
      return;
    }
    try {
      await transferMutation.mutateAsync({
        materialId,
        materialName,
        fromWarehouseId: values.fromWarehouseId,
        fromLocationId: values.fromLocationId,
        toWarehouseId: values.toWarehouseId,
        toLocationId: values.toLocationId,
        quantity: values.quantity,
        unit,
        reason: values.reason || undefined,
        performedBy: currentUser.name,
      });
      toast.success(`${values.quantity.toLocaleString()} ${unit} transferred`);
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <EntityFormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Transfer Stock"
      description={`Move ${materialName} between locations — total stock on hand doesn't change.`}
      onSubmit={onSubmit}
      isSubmitting={transferMutation.isPending}
      submitLabel="Confirm Transfer"
    >
      <Form {...form}>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">From</span>
          <FormField
            control={form.control}
            name="fromLocationId"
            render={({ field }) => (
              <FormItem>
                <Select
                  value={fromWarehouseId && field.value ? `${fromWarehouseId}::${field.value}` : ""}
                  onValueChange={(value) => {
                    const [warehouseId, locationId] = value.split("::");
                    form.setValue("fromWarehouseId", warehouseId, { shouldValidate: true });
                    form.setValue("fromLocationId", locationId, { shouldValidate: true });
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select source location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sourceOptions.map((opt) => (
                      <SelectItem key={`${opt.warehouseId}::${opt.locationId}`} value={`${opt.warehouseId}::${opt.locationId}`}>
                        {opt.warehouseName} — {opt.locationName} ({opt.quantity.toLocaleString()} {unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">To</span>
          <FormField
            control={form.control}
            name="toWarehouseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Warehouse</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("toLocationId", "");
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
            name="toLocationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={!toWarehouseId}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {destinationLocations.map((loc) => (
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
        </div>

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Quantity ({unit}) <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input type="number" min={1} inputMode="numeric" {...field} />
              </FormControl>
              {selectedSource && (
                <p className="text-xs text-muted-foreground">
                  {selectedSource.quantity.toLocaleString()} {unit} available at the source location
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
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g. Moved near the packing line" rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </EntityFormSheet>
  );
}
