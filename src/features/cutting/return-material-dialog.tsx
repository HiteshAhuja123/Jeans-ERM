"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { returnMaterialSchema, type ReturnMaterialValues } from "@/features/cutting/schema";
import { materialReturnHooks } from "@/features/cutting/service";
import { storageLocationHooks, warehouseHooks } from "@/features/warehouses/service";
import { currentUser } from "@/mock-data/users";
import type { CuttingOrder, FabricAllocation } from "@/types";

export function ReturnMaterialDialog({
  open,
  onOpenChange,
  cuttingOrder,
  allocation,
  maxReturnable,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cuttingOrder: CuttingOrder;
  allocation?: FabricAllocation;
  maxReturnable: number;
}) {
  const { data: warehouses = [] } = warehouseHooks.useList();
  const { data: locations = [] } = storageLocationHooks.useList();
  const returnMutation = materialReturnHooks.useReturnMaterial();

  const form = useForm<ReturnMaterialValues>({
    resolver: zodResolver(returnMaterialSchema),
    values: {
      quantity: maxReturnable,
      maxReturnable,
      warehouseId: allocation?.warehouseId ?? "",
      locationId: allocation?.locationId ?? "",
      reason: "",
    },
  });

  const warehouseId = useWatch({ control: form.control, name: "warehouseId" });
  const availableLocations = locations.filter((loc) => loc.status === "active" && loc.warehouseId === warehouseId);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await returnMutation.mutateAsync({
        cuttingOrder,
        quantity: values.quantity,
        warehouseId: values.warehouseId,
        locationId: values.locationId,
        reason: values.reason || undefined,
        returnedBy: currentUser.name,
      });
      toast.success(`${values.quantity.toLocaleString()} ${cuttingOrder.unit} returned to inventory`);
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Return Material — {cuttingOrder.cuttingOrderNumber}</DialogTitle>
          <DialogDescription>
            Send unused fabric back to the warehouse. Up to {maxReturnable.toLocaleString()} {cuttingOrder.unit} is
            currently unused and eligible for return.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="return-material-form" onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Return Quantity ({cuttingOrder.unit})</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={maxReturnable} inputMode="decimal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      {availableLocations.map((loc) => (
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
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="e.g. Leftover fabric after final batch closed out" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={returnMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="return-material-form" disabled={returnMutation.isPending}>
            {returnMutation.isPending ? "Returning…" : "Return Material"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
