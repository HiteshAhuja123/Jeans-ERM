"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { orderPriorityMeta } from "@/lib/status";
import {
  computeMaterialRequirements,
  generatePlanNumber,
  generateProductionOrderNumber,
  getMaterialAvailability,
  getRemainingQuantity,
  materialAvailabilityMeta,
} from "@/lib/production-utils";
import { createPlanFormSchema, type CreatePlanFormValues } from "@/features/production/schema";
import { bomHooks, productionOrderHooks, productionPlanHooks } from "@/features/production/service";
import { orderHooks } from "@/features/orders/service";
import { inventoryHooks } from "@/features/inventory/service";
import { purchaseOrderHooks } from "@/features/purchasing/service";
import { productionLineHooks } from "@/features/production-lines/service";
import { currentUser } from "@/mock-data/users";
import type { Order, OrderLineItem } from "@/types";

let itemIdCounter = 0;
function newItemId() {
  itemIdCounter += 1;
  return `plan-item-${itemIdCounter}`;
}

const plannableOrderStatuses: Order["status"][] = ["confirmed", "in_production", "partially_completed"];

export function CreatePlanView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillOrderId = searchParams.get("orderId");
  const prefillLineItemId = searchParams.get("lineItemId");

  const { data: orders = [] } = orderHooks.useList();
  const { data: existingProductionOrders = [] } = productionOrderHooks.useList();
  const { data: existingPlans = [] } = productionPlanHooks.useList();
  const { data: lines = [] } = productionLineHooks.useList();
  const { data: boms = [] } = bomHooks.useList();
  const { data: balances = [] } = inventoryHooks.useList();
  const { data: purchaseOrders = [] } = purchaseOrderHooks.useList();
  const createPlanMutation = productionPlanHooks.useCreate();
  const createProductionOrderMutation = productionOrderHooks.useCreate();

  const plannableOrders = useMemo(() => orders.filter((o) => plannableOrderStatuses.includes(o.status)), [orders]);

  const today = new Date().toISOString().slice(0, 10);
  const twoWeeksOut = new Date();
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

  const prefillOrder = prefillOrderId ? plannableOrders.find((o) => o.id === prefillOrderId) : undefined;
  const prefillLineItem = prefillOrder?.lineItems.find((li) => li.id === prefillLineItemId);

  const form = useForm<CreatePlanFormValues>({
    resolver: zodResolver(createPlanFormSchema),
    defaultValues: {
      periodStart: today,
      periodEnd: twoWeeksOut.toISOString().slice(0, 10),
      planner: currentUser.name,
      notes: "",
      items: [
        {
          id: newItemId(),
          orderId: prefillOrder?.id ?? "",
          orderLineItemId: prefillLineItem?.id ?? "",
          quantity: prefillLineItem ? getRemainingQuantity(prefillLineItem, existingProductionOrders) : 0,
          priority: prefillOrder?.priority ?? "normal",
          plannedStart: today,
          plannedEnd: twoWeeksOut.toISOString().slice(0, 10),
          productionLineId: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const watchedItems = useWatch({ control: form.control, name: "items" });

  const prefillApplied = useRef(false);

  useEffect(() => {
    // `defaultValues` is captured at mount, before the async order list has loaded, so a
    // `?orderId=&lineItemId=` deep link (e.g. from the Planning Board) can't be resolved yet
    // on the first render — back-fill item 0 once the referenced order/line item are available.
    if (prefillApplied.current || !prefillOrder || !prefillLineItem) return;
    prefillApplied.current = true;
    form.setValue("items.0.orderId", prefillOrder.id, { shouldValidate: true });
    form.setValue("items.0.orderLineItemId", prefillLineItem.id, { shouldValidate: true });
    form.setValue("items.0.quantity", getRemainingQuantity(prefillLineItem, existingProductionOrders));
    form.setValue("items.0.priority", prefillOrder.priority);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillOrder, prefillLineItem, existingProductionOrders]);

  function orderFor(orderId: string): Order | undefined {
    return plannableOrders.find((o) => o.id === orderId);
  }

  function lineItemFor(orderId: string, lineItemId: string): OrderLineItem | undefined {
    return orderFor(orderId)?.lineItems.find((li) => li.id === lineItemId);
  }

  function usedLineItemIds(excludeIndex: number): string[] {
    return (watchedItems ?? [])
      .map((item, index) => (index === excludeIndex ? null : item?.orderLineItemId))
      .filter((v): v is string => Boolean(v));
  }

  const totalQuantity = (watchedItems ?? []).reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);

  async function onSubmit(values: CreatePlanFormValues) {
    try {
      const planNumber = generatePlanNumber(existingPlans);
      const plan = await createPlanMutation.mutateAsync({
        planNumber,
        periodStart: values.periodStart,
        periodEnd: values.periodEnd,
        planner: values.planner,
        status: "draft",
        notes: values.notes || undefined,
        createdDate: today,
      });

      let existingForNumbering = existingProductionOrders;
      for (const item of values.items) {
        const order = orderFor(item.orderId);
        const lineItem = lineItemFor(item.orderId, item.orderLineItemId);
        if (!order || !lineItem) continue;
        const line = lines.find((l) => l.id === item.productionLineId);
        const productionOrderNumber = generateProductionOrderNumber(existingForNumbering);
        const created = await createProductionOrderMutation.mutateAsync({
          productionOrderNumber,
          planId: plan.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderLineItemId: lineItem.id,
          customerId: order.customerId,
          customerName: order.customerName,
          styleId: lineItem.styleId,
          styleCode: lineItem.styleCode,
          styleName: lineItem.styleName,
          colorId: lineItem.colorId,
          colorName: lineItem.colorName,
          quantity: item.quantity,
          unit: "pcs",
          priority: item.priority,
          plannedStart: item.plannedStart,
          plannedEnd: item.plannedEnd,
          productionLineId: item.productionLineId || undefined,
          supervisor: line?.supervisor,
          status: "planned",
          currentStage: "cutting",
          quantityProduced: 0,
        });
        existingForNumbering = [...existingForNumbering, created];
      }

      toast.success(`${plan.planNumber} created with ${values.items.length} production order${values.items.length === 1 ? "" : "s"}`);
      router.push(`/production/plans/${plan.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  const isSubmitting = createPlanMutation.isPending || createProductionOrderMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="New Production Plan" description="Select order items and turn them into production orders" />

      <Form {...form}>
        <Card className="flex flex-col gap-4 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">Plan Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="periodStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Period Start <span className="text-destructive">*</span>
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
              name="periodEnd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Period End <span className="text-destructive">*</span>
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
              name="planner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Planner <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        <Card className="mt-6 flex flex-col gap-4 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Production Orders</h2>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  id: newItemId(),
                  orderId: "",
                  orderLineItemId: "",
                  quantity: 0,
                  priority: "normal",
                  plannedStart: today,
                  plannedEnd: twoWeeksOut.toISOString().slice(0, 10),
                  productionLineId: "",
                })
              }
            >
              <Plus /> Add Order Item
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {fields.map((field, index) => {
              const item = watchedItems?.[index];
              const order = orderFor(item?.orderId ?? "");
              const lineItem = lineItemFor(item?.orderId ?? "", item?.orderLineItemId ?? "");
              const remaining = lineItem ? getRemainingQuantity(lineItem, existingProductionOrders) : 0;
              const excludedIds = usedLineItemIds(index);
              const bom = lineItem ? boms.find((b) => b.styleId === lineItem.styleId) : undefined;
              const materialLines = computeMaterialRequirements(Number(item?.quantity) || 0, bom, balances, purchaseOrders);
              const materialAvailability = getMaterialAvailability(materialLines);
              const materialMeta = materialAvailabilityMeta[materialAvailability];

              return (
                <Card key={field.id} className="flex flex-col gap-3 border-dashed p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove item" onClick={() => remove(index)}>
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name={`items.${index}.orderId`}
                    render={({ field: orderField }) => (
                      <FormItem>
                        <FormLabel>
                          Customer Order <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          value={orderField.value}
                          onValueChange={(value) => {
                            orderField.onChange(value);
                            form.setValue(`items.${index}.orderLineItemId`, "");
                            form.setValue(`items.${index}.quantity`, 0);
                            const selected = plannableOrders.find((o) => o.id === value);
                            if (selected) form.setValue(`items.${index}.priority`, selected.priority);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select order" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {plannableOrders.map((o) => (
                              <SelectItem key={o.id} value={o.id}>
                                {o.orderNumber} — {o.customerName}
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
                    name={`items.${index}.orderLineItemId`}
                    render={({ field: lineField }) => (
                      <FormItem>
                        <FormLabel>
                          Style / Item <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          value={lineField.value}
                          onValueChange={(value) => {
                            lineField.onChange(value);
                            const li = order?.lineItems.find((l) => l.id === value);
                            if (li) form.setValue(`items.${index}.quantity`, getRemainingQuantity(li, existingProductionOrders));
                          }}
                          disabled={!order}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {order?.lineItems
                              .filter((li) => !excludedIds.includes(li.id))
                              .map((li) => (
                                <SelectItem key={li.id} value={li.id}>
                                  {li.styleCode} · {li.colorName} ({getRemainingQuantity(li, existingProductionOrders).toLocaleString()} remaining)
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {lineItem && (
                    <p className="text-xs text-muted-foreground">
                      Ordered {lineItem.quantity.toLocaleString()} pcs · Remaining {remaining.toLocaleString()} pcs
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field: qtyField }) => (
                        <FormItem>
                          <FormLabel>
                            Quantity <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input type="number" min={0} inputMode="numeric" {...qtyField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.priority`}
                      render={({ field: priorityField }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select value={priorityField.value} onValueChange={priorityField.onChange}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(orderPriorityMeta).map(([value, meta]) => (
                                <SelectItem key={value} value={value}>
                                  {meta.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.plannedStart`}
                      render={({ field: startField }) => (
                        <FormItem>
                          <FormLabel>
                            Planned Start <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...startField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.plannedEnd`}
                      render={({ field: endField }) => (
                        <FormItem>
                          <FormLabel>
                            Planned End <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...endField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`items.${index}.productionLineId`}
                    render={({ field: lineFieldSelect }) => (
                      <FormItem>
                        <FormLabel>Production Line</FormLabel>
                        <Select value={lineFieldSelect.value} onValueChange={lineFieldSelect.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {lines
                              .filter((l) => l.status === "active")
                              .map((l) => (
                                <SelectItem key={l.id} value={l.id}>
                                  {l.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {lineItem && (
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-xs text-muted-foreground">Material readiness for this quantity</span>
                      <StatusBadge label={materialMeta.label} level={materialMeta.level} />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

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

          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4 text-sm">
            <span className="font-medium text-foreground">Total production quantity</span>
            <span className="font-semibold tabular-nums text-foreground">{totalQuantity.toLocaleString()} pcs</span>
          </div>
        </Card>
      </Form>

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/production/planning")} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create Plan"}
        </Button>
      </div>
    </div>
  );
}
