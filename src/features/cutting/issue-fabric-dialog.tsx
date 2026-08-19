"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { issueFabricSchema, type IssueFabricValues } from "@/features/cutting/schema";
import { fabricIssueHooks } from "@/features/cutting/service";
import { storageLocationHooks, warehouseHooks } from "@/features/warehouses/service";
import { currentUser } from "@/mock-data/users";
import type { CuttingOrder, FabricAllocation } from "@/types";

export function IssueFabricDialog({
  open,
  onOpenChange,
  cuttingOrder,
  allocation,
  remaining,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cuttingOrder: CuttingOrder;
  allocation: FabricAllocation;
  remaining: number;
}) {
  const { data: warehouses = [] } = warehouseHooks.useList();
  const { data: locations = [] } = storageLocationHooks.useList();
  const issueMutation = fabricIssueHooks.useIssueFabric();

  const form = useForm<IssueFabricValues>({
    resolver: zodResolver(issueFabricSchema),
    values: {
      quantity: remaining,
      maxIssuable: remaining,
      warehouseId: allocation.warehouseId,
      locationId: allocation.locationId,
    },
  });

  const warehouseId = useWatch({ control: form.control, name: "warehouseId" });
  const availableLocations = locations.filter((loc) => loc.status === "active" && loc.warehouseId === warehouseId);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await issueMutation.mutateAsync({
        cuttingOrder,
        fabricAllocationId: allocation.id,
        quantity: values.quantity,
        warehouseId: values.warehouseId,
        locationId: values.locationId,
        issuedBy: currentUser.name,
      });
      toast.success(`${values.quantity.toLocaleString()} ${cuttingOrder.unit} issued to cutting`);
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue Fabric — {cuttingOrder.cuttingOrderNumber}</DialogTitle>
          <DialogDescription>
            {remaining.toLocaleString()} {cuttingOrder.unit} remaining on allocation {allocation.allocationNumber}. Issues
            may be partial — issue what&apos;s ready now and the rest later.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="issue-fabric-form" onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Quantity ({cuttingOrder.unit})</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={remaining} inputMode="decimal" {...field} />
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
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={issueMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="issue-fabric-form" disabled={issueMutation.isPending}>
            {issueMutation.isPending ? "Issuing…" : "Issue Fabric"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
