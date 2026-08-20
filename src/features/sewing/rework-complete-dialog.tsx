"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { completeReworkSchema, type CompleteReworkValues } from "@/features/sewing/schema";
import { sewingReworkActionHooks } from "@/features/sewing/service";
import type { SewingOrder, SewingRework } from "@/types";

export function ReworkCompleteDialog({
  open,
  onOpenChange,
  sewingOrder,
  rework,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sewingOrder: SewingOrder;
  rework: SewingRework;
}) {
  const completeMutation = sewingReworkActionHooks.useComplete();

  const form = useForm<CompleteReworkValues>({
    resolver: zodResolver(completeReworkSchema),
    values: { completedQuantity: rework.quantity, rejectedQuantity: 0, totalQuantity: rework.quantity },
  });

  const completedQuantity = useWatch({ control: form.control, name: "completedQuantity" }) || 0;
  const rejectedQuantity = useWatch({ control: form.control, name: "rejectedQuantity" }) || 0;
  const accounted = Number(completedQuantity) + Number(rejectedQuantity);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await completeMutation.mutateAsync({
        rework,
        sewingOrder,
        completedQuantity: values.completedQuantity,
        rejectedQuantity: values.rejectedQuantity,
      });
      toast.success(`${rework.reworkNumber} resolved`);
      onOpenChange(false);
      form.reset();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Rework — {rework.reworkNumber}</DialogTitle>
          <DialogDescription>
            {rework.quantity.toLocaleString()} pcs were sent for rework. Record how many were recovered as good pieces versus rejected —
            recovered pieces count toward good output once, never twice.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="rework-complete-form" onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="completedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recovered (Good)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={rework.quantity} inputMode="numeric" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rejectedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejected</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={rework.quantity} inputMode="numeric" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <p className={accounted === rework.quantity ? "rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground" : "rounded-lg border border-critical/25 bg-critical-subtle px-3 py-2 text-xs text-critical"}>
              Recovered + Rejected = <span className="font-medium">{accounted.toLocaleString()}</span> — must equal the rework quantity ({rework.quantity.toLocaleString()})
            </p>
            <FormField control={form.control} name="completedQuantity" render={() => <FormMessage />} />
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={completeMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="rework-complete-form" disabled={completeMutation.isPending}>
            {completeMutation.isPending ? "Saving…" : "Complete Rework"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
