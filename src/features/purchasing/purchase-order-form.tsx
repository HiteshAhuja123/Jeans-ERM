"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { computePoAmounts, generatePoNumber } from "@/lib/purchasing-utils";
import { purchaseOrderFormSchema, type PurchaseOrderFormValues } from "@/features/purchasing/schema";
import { purchaseOrderHooks, purchaseRequestHooks } from "@/features/purchasing/service";
import { materialHooks } from "@/features/materials/service";
import { supplierHooks } from "@/features/suppliers/service";
import { mockUnitsOfMeasure } from "@/mock-data";
import type { PurchaseOrder } from "@/types";

let itemIdCounter = 0;

function emptyItem() {
  itemIdCounter += 1;
  return { id: `new-po-item-${itemIdCounter}`, materialId: "", quantity: 0, unitPrice: 0 };
}

export function PurchaseOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRequestId = searchParams.get("fromRequest");

  const { data: suppliers = [] } = supplierHooks.useList();
  const { data: materials = [] } = materialHooks.useList();
  const { data: existingOrders = [] } = purchaseOrderHooks.useList();
  const { data: sourceRequest } = purchaseRequestHooks.useDetail(fromRequestId ?? undefined);
  const createMutation = purchaseOrderHooks.useCreate();
  const updateRequestMutation = purchaseRequestHooks.useUpdate();

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderFormSchema),
    defaultValues: {
      supplierId: "",
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDate: "",
      discount: 0,
      tax: 0,
      notes: "",
      items: [emptyItem()],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  useEffect(() => {
    if (!sourceRequest) return;
    form.reset({
      supplierId: sourceRequest.preferredSupplierId ?? "",
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDate: "",
      discount: 0,
      tax: 0,
      notes: `Raised from purchase request ${sourceRequest.requestNumber}.`,
      items: [{ id: `new-po-item-${++itemIdCounter}`, materialId: sourceRequest.materialId, quantity: sourceRequest.quantity, unitPrice: 0 }],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceRequest]);

  const watchedItems = useWatch({ control: form.control, name: "items" });
  const discount = useWatch({ control: form.control, name: "discount" });
  const tax = useWatch({ control: form.control, name: "tax" });

  const amounts = useMemo(
    () => computePoAmounts(watchedItems ?? [], Number(discount) || 0, Number(tax) || 0),
    [watchedItems, discount, tax],
  );

  function unitFor(materialId: string) {
    const material = materials.find((m) => m.id === materialId);
    return material ? mockUnitsOfMeasure.find((u) => u.id === material.uomId)?.code ?? "" : "";
  }

  async function handleSave(status: PurchaseOrder["status"]) {
    const valid = await form.trigger();
    if (!valid) {
      toast.error("Please fix the highlighted fields before continuing.");
      return;
    }
    const values = form.getValues();
    const supplier = suppliers.find((s) => s.id === values.supplierId);
    if (!supplier) return;

    const items = values.items.map((item) => {
      const material = materials.find((m) => m.id === item.materialId);
      return {
        id: item.id.startsWith("new-po-item-") ? `po-item-${item.id}` : item.id,
        materialId: item.materialId,
        materialCode: material?.code ?? "",
        materialName: material?.name ?? "",
        quantity: item.quantity,
        unit: unitFor(item.materialId),
        unitPrice: item.unitPrice,
        receivedQuantity: 0,
      };
    });
    const { subtotal, total } = computePoAmounts(items, values.discount, values.tax);

    try {
      const poNumber = generatePoNumber(existingOrders);
      const created = await createMutation.mutateAsync({
        poNumber,
        supplierId: supplier.id,
        supplierName: supplier.name,
        orderDate: values.orderDate,
        expectedDate: values.expectedDate,
        status,
        items,
        subtotal,
        discount: values.discount,
        tax: values.tax,
        totalValue: total,
        notes: values.notes || undefined,
      });

      if (sourceRequest) {
        await updateRequestMutation.mutateAsync({
          id: sourceRequest.id,
          patch: { status: "converted", convertedToPoId: created.id },
        });
      }

      toast.success(`Purchase order ${created.poNumber} ${status === "draft" ? "saved as draft" : "created"}`);
      router.push(`/purchasing/orders/${created.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  const isSubmitting = createMutation.isPending || updateRequestMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="New Purchase Order" description="Order materials from a supplier" />

      <Form {...form}>
        <Card className="flex flex-col gap-4 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">Supplier &amp; Dates</h2>
          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Supplier <span className="text-destructive">*</span>
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select supplier" />
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="orderDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Order Date <span className="text-destructive">*</span>
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
              name="expectedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Expected Delivery <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        <Card className="mt-6 flex flex-col gap-4 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Items</h2>
            <Button type="button" variant="outline" onClick={() => append(emptyItem())}>
              <Plus /> Add Item
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {fields.map((field, index) => {
              const item = watchedItems?.[index];
              const lineTotal = (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0);
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
                    name={`items.${index}.materialId`}
                    render={({ field: materialField }) => (
                      <FormItem>
                        <FormLabel>
                          Material <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select value={materialField.value} onValueChange={materialField.onChange}>
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
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field: qtyField }) => (
                        <FormItem>
                          <FormLabel>
                            Quantity {unitFor(item?.materialId ?? "") ? `(${unitFor(item?.materialId ?? "")})` : ""}{" "}
                            <span className="text-destructive">*</span>
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
                      name={`items.${index}.unitPrice`}
                      render={({ field: priceField }) => (
                        <FormItem>
                          <FormLabel>
                            Unit Price (₹) <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step="0.01" inputMode="decimal" {...priceField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="text-right text-sm font-medium text-foreground">Line total: {formatCurrency(lineTotal)}</p>
                </Card>
              );
            })}
          </div>
        </Card>

        <Card className="mt-6 flex flex-col gap-4 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">Totals</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" inputMode="decimal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" inputMode="decimal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-4 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(amounts.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-foreground">
              <span>Grand Total</span>
              <span className="tabular-nums">{formatCurrency(amounts.total)}</span>
            </div>
          </div>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>
      </Form>

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/purchasing")} disabled={isSubmitting}>
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => handleSave("draft")} disabled={isSubmitting}>
            Save Draft
          </Button>
          <Button type="button" onClick={() => handleSave("pending_approval")} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Create Purchase Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
