"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { assignSewingOrderSchema, type AssignSewingOrderValues } from "@/features/sewing/schema";
import { sewingOrderActionHooks, sewingOrderHooks, sewingProductionEntryHooks, sewingReworkHooks } from "@/features/sewing/service";
import { bundleHooks } from "@/features/cutting/bundle-service";
import { employeeHooks } from "@/features/employees/service";
import { productionLineHooks } from "@/features/production-lines/service";
import { getAssignableBundles, getSewingLineSnapshot, getLineOverCapacityAmount } from "@/lib/sewing-utils";
import { mockDepartments } from "@/mock-data";
import type { SewingOrder } from "@/types";

const sewingDeptId = mockDepartments.find((d) => d.code === "SEW")?.id;

export function AssignSewingOrderDialog({
  open,
  onOpenChange,
  sewingOrder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sewingOrder: SewingOrder;
}) {
  const { data: lines = [] } = productionLineHooks.useList();
  const { data: employees = [] } = employeeHooks.useList();
  const { data: bundles = [] } = bundleHooks.useList();
  const { data: sewingOrders = [] } = sewingOrderHooks.useList();
  const { data: entries = [] } = sewingProductionEntryHooks.useList();
  const { data: reworks = [] } = sewingReworkHooks.useList();
  const assignMutation = sewingOrderActionHooks.useAssign();

  const sewingLines = useMemo(() => lines.filter((l) => l.departmentId === sewingDeptId && l.status === "active"), [lines]);
  const supervisors = useMemo(
    () => employees.filter((e) => e.departmentId === sewingDeptId && e.status === "active" && e.designation.toLowerCase().includes("supervisor")),
    [employees],
  );
  const assignableBundles = useMemo(
    () => getAssignableBundles(sewingOrder.productionOrderId, bundles),
    [bundles, sewingOrder.productionOrderId],
  );

  const form = useForm<AssignSewingOrderValues>({
    resolver: zodResolver(assignSewingOrderSchema),
    values: {
      productionLineId: sewingOrder.productionLineId ?? "",
      supervisor: sewingOrder.supervisor ?? "",
      plannedStart: sewingOrder.plannedStart ?? "",
      plannedEnd: sewingOrder.plannedEnd ?? "",
      bundleIds: [],
    },
  });

  const selectedLineId = useWatch({ control: form.control, name: "productionLineId" });
  const selectedBundleIds = useWatch({ control: form.control, name: "bundleIds" }) ?? [];
  const selectedLine = sewingLines.find((l) => l.id === selectedLineId);
  const selectedTotal = assignableBundles.filter((b) => selectedBundleIds.includes(b.id)).reduce((sum, b) => sum + b.quantity, 0);

  const capacityWarning = useMemo(() => {
    if (!selectedLine) return undefined;
    const snapshot = getSewingLineSnapshot(selectedLine, sewingOrders, entries, reworks);
    const projected = snapshot.assigned + selectedTotal;
    const overBy = getLineOverCapacityAmount({ assigned: projected, dailyCapacity: snapshot.dailyCapacity });
    if (overBy <= 0) return undefined;
    return `${selectedLine.name} already has ${snapshot.assigned.toLocaleString()} pcs planned — this assignment would put it ${overBy.toLocaleString()} pcs over its ${snapshot.dailyCapacity.toLocaleString()} pcs capacity.`;
  }, [selectedLine, sewingOrders, entries, reworks, selectedTotal]);

  function toggleBundle(bundleId: string, checked: boolean) {
    const current = form.getValues("bundleIds") ?? [];
    form.setValue(
      "bundleIds",
      checked ? [...current, bundleId] : current.filter((id) => id !== bundleId),
      { shouldValidate: true },
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const selected = assignableBundles.filter((b) => values.bundleIds.includes(b.id));
    try {
      await assignMutation.mutateAsync({
        sewingOrder,
        bundles: selected,
        productionLineId: values.productionLineId,
        supervisor: values.supervisor,
        plannedStart: values.plannedStart,
        plannedEnd: values.plannedEnd,
      });
      toast.success(`${sewingOrder.sewingOrderNumber} assigned to ${sewingLines.find((l) => l.id === values.productionLineId)?.name ?? "line"}`);
      onOpenChange(false);
      form.reset();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign to Line — {sewingOrder.sewingOrderNumber}</DialogTitle>
          <DialogDescription>Pick a line, supervisor and schedule, then choose which ready bundles to assign.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="assign-sewing-order-form" onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="productionLineId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Sewing Line <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a line" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sewingLines.map((line) => (
                        <SelectItem key={line.id} value={line.id}>
                          {line.name} — {line.capacity.toLocaleString()} pcs/day
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {capacityWarning && (
              <p className="flex items-start gap-1.5 rounded-lg border border-warning/25 bg-warning-subtle px-3 py-2 text-xs text-warning">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> {capacityWarning}
              </p>
            )}
            <FormField
              control={form.control}
              name="supervisor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Supervisor <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a supervisor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {supervisors.map((e) => (
                        <SelectItem key={e.id} value={e.name}>
                          {e.name}
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
                name="plannedStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Start Date <span className="text-destructive">*</span>
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
                name="plannedEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      End Date <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Bundles Ready for Sewing</span>
                <span className="text-xs text-muted-foreground">{selectedTotal.toLocaleString()} pcs selected</span>
              </div>
              {assignableBundles.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                  No verified bundles are waiting for this production order.
                </p>
              ) : (
                <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto rounded-lg border border-border p-2">
                  {assignableBundles.map((bundle) => (
                    <label
                      key={bundle.id}
                      htmlFor={`bundle-${bundle.id}`}
                      className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <span className="flex flex-col">
                        <span className="font-medium text-foreground">{bundle.bundleNumber}</span>
                        <span className="text-xs text-muted-foreground">
                          Size {bundle.items.map((i) => i.sizeCode).join(", ")} · {bundle.quantity.toLocaleString()} pcs
                        </span>
                      </span>
                      <Switch
                        id={`bundle-${bundle.id}`}
                        checked={selectedBundleIds.includes(bundle.id)}
                        onCheckedChange={(checked) => toggleBundle(bundle.id, checked)}
                      />
                    </label>
                  ))}
                </div>
              )}
              <FormField control={form.control} name="bundleIds" render={() => <FormMessage />} />
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={assignMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="assign-sewing-order-form" disabled={assignMutation.isPending}>
            {assignMutation.isPending ? "Assigning…" : "Assign to Line"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
