"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAvailableForBundlingBySize, getBatchSizeBreakdown } from "@/lib/cutting-utils";
import { generateBundlesSchema, type GenerateBundlesValues } from "@/features/cutting/schema";
import { bundleActionHooks } from "@/features/cutting/bundle-service";
import { mockSizes, mockSkus } from "@/mock-data";
import { currentUser } from "@/mock-data/users";
import type { Bundle, CuttingBatch, CuttingOrder, CuttingOutput } from "@/types";

const DEFAULT_BUNDLE_SIZE = 50;

export function GenerateBundlesDialog({
  open,
  onOpenChange,
  batch,
  cuttingPlanId,
  cuttingOrder,
  outputs,
  bundles,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: CuttingBatch;
  cuttingPlanId: string;
  cuttingOrder: CuttingOrder;
  outputs: CuttingOutput[];
  bundles: Bundle[];
}) {
  const generateMutation = bundleActionHooks.useGenerate();

  const sizeOptions = useMemo(() => {
    const breakdown = getBatchSizeBreakdown(batch.id, outputs);
    return breakdown
      .map((line) => {
        const size = mockSizes.find((s) => s.id === line.sizeId);
        const available = getAvailableForBundlingBySize(batch.id, line.sizeId, outputs, bundles);
        return { sizeId: line.sizeId, sizeCode: size?.code ?? line.sizeId, sequence: size?.sequence ?? 0, available };
      })
      .filter((line) => line.available > 0)
      .sort((a, b) => a.sequence - b.sequence);
  }, [batch.id, outputs, bundles]);

  const firstAvailable = sizeOptions[0];

  const form = useForm<GenerateBundlesValues>({
    resolver: zodResolver(generateBundlesSchema),
    values: {
      sizeId: firstAvailable?.sizeId ?? "",
      bundleSize: DEFAULT_BUNDLE_SIZE,
      numberOfBundles: firstAvailable ? Math.floor(firstAvailable.available / DEFAULT_BUNDLE_SIZE) : 0,
      maxAvailable: firstAvailable?.available ?? 0,
    },
  });

  const sizeId = useWatch({ control: form.control, name: "sizeId" });
  const bundleSize = useWatch({ control: form.control, name: "bundleSize" }) || 0;
  const numberOfBundles = useWatch({ control: form.control, name: "numberOfBundles" }) || 0;
  const selected = sizeOptions.find((s) => s.sizeId === sizeId);

  useEffect(() => {
    if (!selected) return;
    form.setValue("maxAvailable", selected.available);
  }, [selected, form]);

  const totalToBundle = bundleSize * numberOfBundles;
  const remainingAfter = Math.max(0, (selected?.available ?? 0) - totalToBundle);

  const onSubmit = form.handleSubmit(async (values) => {
    const chosen = sizeOptions.find((s) => s.sizeId === values.sizeId);
    if (!chosen) return;
    const skuId = mockSkus.find((s) => s.styleId === batch.styleId && s.colorId === batch.colorId && s.sizeId === values.sizeId)?.id;
    try {
      const created = await generateMutation.mutateAsync({
        cuttingBatch: batch,
        cuttingPlanId,
        cuttingOrder,
        sizeId: values.sizeId,
        sizeCode: chosen.sizeCode,
        skuId,
        bundleSize: values.bundleSize,
        count: values.numberOfBundles,
        createdBy: currentUser.name,
      });
      toast.success(`${created.length} bundle${created.length === 1 ? "" : "s"} generated`);
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  if (sizeOptions.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Bundles — {batch.batchNumber}</DialogTitle>
            <DialogDescription>There is no good cut output available to bundle for this batch yet.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Bundles — {batch.batchNumber}</DialogTitle>
          <DialogDescription>{batch.styleCode} · {batch.colorName} — pick a size, a bundle size and how many bundles to create.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="generate-bundles-form" onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="sizeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      const next = sizeOptions.find((s) => s.sizeId === value);
                      form.setValue("numberOfBundles", next ? Math.floor(next.available / bundleSize) : 0);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sizeOptions.map((s) => (
                        <SelectItem key={s.sizeId} value={s.sizeId}>
                          Size {s.sizeCode} — {s.available.toLocaleString()} available
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
                name="bundleSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bundle Size (pcs)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfBundles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Bundles</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-1 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              <span>
                Will create <span className="font-medium text-foreground">{numberOfBundles || 0}</span> bundle
                {numberOfBundles === 1 ? "" : "s"} of {bundleSize || 0} pcs ={" "}
                <span className="font-medium text-foreground">{totalToBundle.toLocaleString()} pcs</span>
              </span>
              <span>{remainingAfter.toLocaleString()} pcs will remain available for bundling in this size</span>
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generateMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="generate-bundles-form" disabled={generateMutation.isPending}>
            {generateMutation.isPending ? "Generating…" : "Generate Bundles"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
