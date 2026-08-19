"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { recordCuttingOutputSchema, type RecordCuttingOutputValues } from "@/features/cutting/schema";
import { cuttingOutputHooks } from "@/features/cutting/service";
import { mockCuttingRejectionReasons, mockSizes, mockWastageReasons } from "@/mock-data";
import { currentUser } from "@/mock-data/users";
import type { CuttingBatch } from "@/types";

export function RecordOutputDialog({
  open,
  onOpenChange,
  batch,
  priorCutQuantity,
  unit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: CuttingBatch;
  priorCutQuantity: number;
  unit: string;
}) {
  const recordMutation = cuttingOutputHooks.useRecordOutput();
  const remaining = Math.max(0, batch.plannedQuantity - priorCutQuantity);
  const activeSizes = mockSizes.filter((s) => s.status === "active").sort((a, b) => a.sequence - b.sequence);
  const activeReasons = mockCuttingRejectionReasons.filter((r) => r.status === "active");

  const form = useForm<RecordCuttingOutputValues>({
    resolver: zodResolver(recordCuttingOutputSchema),
    values: {
      cutQuantity: 0,
      rejectedQuantity: 0,
      fabricUsed: 0,
      maxCutQuantity: remaining,
      wastageReasonId: undefined,
      notes: "",
      sizeLines: activeSizes.map((s) => ({ sizeId: s.id, sizeCode: s.code, quantity: 0 })),
      rejectionLines: activeReasons.map((r) => ({ reasonId: r.id, label: r.label, quantity: 0 })),
    },
  });

  const { fields: sizeFields } = useFieldArray({ control: form.control, name: "sizeLines" });
  const { fields: rejectionFields } = useFieldArray({ control: form.control, name: "rejectionLines" });
  const cutQuantity = useWatch({ control: form.control, name: "cutQuantity" }) || 0;
  const rejectedQuantity = useWatch({ control: form.control, name: "rejectedQuantity" }) || 0;
  const sizeLines = useWatch({ control: form.control, name: "sizeLines" }) ?? [];
  const rejectionLines = useWatch({ control: form.control, name: "rejectionLines" }) ?? [];
  const goodQuantity = Math.max(0, Number(cutQuantity) - Number(rejectedQuantity));
  const sizeSum = sizeLines.reduce((sum, l) => sum + (Number(l?.quantity) || 0), 0);
  const rejectionSum = rejectionLines.reduce((sum, l) => sum + (Number(l?.quantity) || 0), 0);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await recordMutation.mutateAsync({
        batch,
        cutQuantity: values.cutQuantity,
        rejectedQuantity: values.rejectedQuantity,
        fabricUsed: values.fabricUsed,
        unit,
        sizeBreakdown: values.sizeLines.filter((l) => l.quantity > 0).map((l) => ({ sizeId: l.sizeId, quantity: l.quantity })),
        wastageReasonId: values.wastageReasonId,
        notes: values.notes || undefined,
        rejectionBreakdown: values.rejectionLines.filter((l) => l.quantity > 0).map((l) => ({ reasonId: l.reasonId, quantity: l.quantity })),
        recordedBy: currentUser.name,
        priorCutQuantity,
      });
      toast.success(`Output recorded for ${batch.batchNumber}`);
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
          <DialogTitle>Record Output — {batch.batchNumber}</DialogTitle>
          <DialogDescription>
            {remaining.toLocaleString()} pcs remaining of the {batch.plannedQuantity.toLocaleString()} planned for this
            batch.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="record-output-form" onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="cutQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cut Quantity (pcs)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={remaining} inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rejectedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejected (pcs)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              Good output = {cutQuantity.toLocaleString()} cut − {rejectedQuantity.toLocaleString()} rejected ={" "}
              <span className="font-medium text-foreground">{goodQuantity.toLocaleString()} pcs</span>
            </p>

            <FormField
              control={form.control}
              name="fabricUsed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fabric Used ({unit})</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} inputMode="decimal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wastageReasonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wastage Reason</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockWastageReasons
                        .filter((r) => r.status === "active")
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Size Breakdown (good pieces)</span>
                <span className={sizeSum === goodQuantity ? "text-xs text-muted-foreground" : "text-xs font-medium text-critical"}>
                  {sizeSum.toLocaleString()} / {goodQuantity.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {sizeFields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`sizeLines.${index}.quantity`}
                    render={({ field: qtyField }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Size {field.sizeCode}</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} inputMode="numeric" {...qtyField} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormField control={form.control} name="sizeLines" render={() => <FormMessage />} />
            </div>

            {rejectedQuantity > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Rejection Reasons</span>
                  <span className={rejectionSum === rejectedQuantity ? "text-xs text-muted-foreground" : "text-xs font-medium text-critical"}>
                    {rejectionSum.toLocaleString()} / {rejectedQuantity.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {rejectionFields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`rejectionLines.${index}.quantity`}
                      render={({ field: qtyField }) => (
                        <FormItem className="flex flex-row items-center justify-between gap-3 space-y-0">
                          <FormLabel className="text-xs font-normal text-foreground">{field.label}</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} inputMode="numeric" className="w-24" {...qtyField} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <FormField control={form.control} name="rejectionLines" render={() => <FormMessage />} />
              </div>
            )}

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
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={recordMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="record-output-form" disabled={recordMutation.isPending}>
            {recordMutation.isPending ? "Saving…" : "Record Output"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
