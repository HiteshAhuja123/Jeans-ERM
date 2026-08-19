"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Lock, PackageX } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { canReceiveAgainstPo, generateGrnNumber, getPendingQuantity } from "@/lib/purchasing-utils";
import { goodsReceiptHooks, purchaseOrderHooks } from "@/features/purchasing/service";
import { inventoryHooks } from "@/features/inventory/service";
import { storageLocationHooks, warehouseHooks } from "@/features/warehouses/service";
import { currentUser } from "@/mock-data/users";
import type { ReceivingItemStatus } from "@/types";

const receiveItemSchema = z.object({
  poItemId: z.string(),
  materialId: z.string(),
  materialCode: z.string(),
  materialName: z.string(),
  unit: z.string(),
  maxPending: z.coerce.number(),
  receivingQuantity: z.coerce.number().min(0),
  rejectedQuantity: z.coerce.number().min(0),
  warehouseId: z.string(),
  locationId: z.string(),
});

const receiveFormSchema = z
  .object({
    receivedDate: z.string().min(1, "Enter a received date"),
    notes: z.string().max(500).optional(),
    items: z.array(receiveItemSchema),
  })
  .superRefine((data, ctx) => {
    let anyReceiving = false;
    data.items.forEach((item, index) => {
      if (item.receivingQuantity <= 0) return;
      anyReceiving = true;
      if (item.receivingQuantity > item.maxPending) {
        ctx.addIssue({
          code: "custom",
          message: `Cannot exceed the pending quantity (${item.maxPending.toLocaleString()} ${item.unit})`,
          path: ["items", index, "receivingQuantity"],
        });
      }
      if (item.rejectedQuantity > item.receivingQuantity) {
        ctx.addIssue({
          code: "custom",
          message: "Rejected quantity cannot exceed the received quantity",
          path: ["items", index, "rejectedQuantity"],
        });
      }
      if (!item.warehouseId) {
        ctx.addIssue({ code: "custom", message: "Select a warehouse", path: ["items", index, "warehouseId"] });
      }
      if (!item.locationId) {
        ctx.addIssue({ code: "custom", message: "Select a location", path: ["items", index, "locationId"] });
      }
    });
    if (!anyReceiving) {
      ctx.addIssue({ code: "custom", message: "Enter a received quantity for at least one item", path: ["items"] });
    }
  });

type ReceiveFormValues = z.infer<typeof receiveFormSchema>;

function inspectionStatusFor(receiving: number, rejected: number): ReceivingItemStatus {
  if (receiving <= 0) return "pending_inspection";
  if (rejected <= 0) return "accepted";
  if (rejected >= receiving) return "rejected";
  return "partially_accepted";
}

export function GoodsReceiptView({ id }: { id: string }) {
  const router = useRouter();
  const { data: po, isLoading } = purchaseOrderHooks.useDetail(id);
  const { data: warehouses = [] } = warehouseHooks.useList();
  const { data: locations = [] } = storageLocationHooks.useList();
  const { data: balances = [] } = inventoryHooks.useList();
  const { data: existingReceipts = [] } = goodsReceiptHooks.useList();
  const confirmMutation = goodsReceiptHooks.useConfirmReceipt();

  const pendingItems = useMemo(() => (po ? po.items.filter((item) => getPendingQuantity(item) > 0) : []), [po]);

  const form = useForm<ReceiveFormValues>({
    resolver: zodResolver(receiveFormSchema),
    values: po
      ? {
          receivedDate: new Date().toISOString().slice(0, 10),
          notes: "",
          items: pendingItems.map((item) => {
            const balance = balances.find((b) => b.materialId === item.materialId);
            const primaryLocation = balance?.locations[0];
            return {
              poItemId: item.id,
              materialId: item.materialId,
              materialCode: item.materialCode,
              materialName: item.materialName,
              unit: item.unit,
              maxPending: getPendingQuantity(item),
              receivingQuantity: getPendingQuantity(item),
              rejectedQuantity: 0,
              warehouseId: primaryLocation?.warehouseId ?? "",
              locationId: primaryLocation?.locationId ?? "",
            };
          }),
        }
      : undefined,
  });

  const { fields } = useFieldArray({ control: form.control, name: "items" });
  const watchedItems = useWatch({ control: form.control, name: "items" });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!po) {
    return (
      <EmptyState
        icon={PackageX}
        title="Purchase order not found"
        description="This order may have been removed."
        action={{ label: "Back to Purchasing", onClick: () => router.push("/purchasing") }}
      />
    );
  }

  if (!canReceiveAgainstPo(po.status)) {
    return (
      <EmptyState
        icon={Lock}
        title="This order can't receive material right now"
        description="Only orders that have been sent to the supplier and aren't fully received can accept a delivery."
        action={{ label: "Back to Order", onClick: () => router.push(`/purchasing/orders/${id}`) }}
      />
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const itemsToReceive = values.items.filter((item) => item.receivingQuantity > 0);
    if (itemsToReceive.length === 0) return;

    try {
      const grnNumber = generateGrnNumber(existingReceipts);
      const result = await confirmMutation.mutateAsync({
        po,
        grnNumber,
        receivedDate: values.receivedDate,
        receivedBy: currentUser.name,
        notes: values.notes || undefined,
        items: itemsToReceive.map((item) => ({
          poItemId: item.poItemId,
          materialId: item.materialId,
          materialCode: item.materialCode,
          materialName: item.materialName,
          receivedQuantity: item.receivingQuantity,
          acceptedQuantity: item.receivingQuantity - item.rejectedQuantity,
          rejectedQuantity: item.rejectedQuantity,
          unit: item.unit,
          inspectionStatus: inspectionStatusFor(item.receivingQuantity, item.rejectedQuantity),
          warehouseId: item.warehouseId,
          locationId: item.locationId,
        })),
      });
      toast.success(`Receipt ${grnNumber} confirmed`);
      router.push(`/purchasing/orders/${result.purchaseOrder.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Receive Material — ${po.poNumber}`} description={`From ${po.supplierName}`} />

      <Form {...form}>
        <div className="flex flex-col gap-4">
          {fields.map((field, index) => {
            const item = watchedItems?.[index];
            const availableLocations = locations.filter((loc) => loc.status === "active" && loc.warehouseId === item?.warehouseId);
            const accepted = Math.max(0, (Number(item?.receivingQuantity) || 0) - (Number(item?.rejectedQuantity) || 0));
            return (
              <Card key={field.id} className="flex flex-col gap-3 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {field.materialCode} — {field.materialName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Pending: {field.maxPending.toLocaleString()} {field.unit}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.receivingQuantity`}
                    render={({ field: qtyField }) => (
                      <FormItem>
                        <FormLabel>Received Quantity ({field.unit})</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} inputMode="numeric" {...qtyField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.rejectedQuantity`}
                    render={({ field: rejField }) => (
                      <FormItem>
                        <FormLabel>Rejected Quantity ({field.unit})</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} inputMode="numeric" {...rejField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.warehouseId`}
                    render={({ field: whField }) => (
                      <FormItem>
                        <FormLabel>Warehouse</FormLabel>
                        <Select
                          value={whField.value}
                          onValueChange={(value) => {
                            whField.onChange(value);
                            form.setValue(`items.${index}.locationId`, "");
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
                    name={`items.${index}.locationId`}
                    render={({ field: locField }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <Select value={locField.value} onValueChange={locField.onChange} disabled={!item?.warehouseId}>
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
                </div>
                <p className="text-xs text-muted-foreground">
                  {accepted.toLocaleString()} {field.unit} will be added to inventory
                  {Number(item?.rejectedQuantity) > 0 ? ` · ${item?.rejectedQuantity.toLocaleString()} ${field.unit} rejected` : ""}
                </p>
              </Card>
            );
          })}

          <Card className="flex flex-col gap-3 p-4 sm:p-5">
            <FormField
              control={form.control}
              name="receivedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Received Date <span className="text-destructive">*</span>
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
          </Card>
        </div>
      </Form>

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" onClick={() => router.push(`/purchasing/orders/${id}`)} disabled={confirmMutation.isPending}>
          Cancel
        </Button>
        <Button type="button" onClick={onSubmit} disabled={confirmMutation.isPending}>
          {confirmMutation.isPending ? "Confirming…" : "Confirm Receipt"}
        </Button>
      </div>
    </div>
  );
}
