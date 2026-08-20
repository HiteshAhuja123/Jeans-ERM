"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PauseCircle, PlayCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { sewingHoldReasonSchema, type SewingHoldReasonValues } from "@/features/sewing/schema";
import { sewingOrderActionHooks } from "@/features/sewing/service";
import { sewingHoldReasonLabels } from "@/mock-data/sewing-reasons";
import type { SewingOrder } from "@/types";

export function SewingOrderHoldControls({ sewingOrder }: { sewingOrder: SewingOrder }) {
  const [open, setOpen] = useState(false);
  const holdMutation = sewingOrderActionHooks.useHold();
  const resumeMutation = sewingOrderActionHooks.useResume();

  const form = useForm<SewingHoldReasonValues>({
    resolver: zodResolver(sewingHoldReasonSchema),
    defaultValues: { category: "supervisor_decision", details: "" },
  });

  if (sewingOrder.status === "on_hold") {
    return (
      <Button
        variant="outline"
        onClick={async () => {
          try {
            await resumeMutation.mutateAsync(sewingOrder);
            toast.success(`${sewingOrder.sewingOrderNumber} resumed`);
          } catch {
            toast.error("Something went wrong. Please try again.");
          }
        }}
        disabled={resumeMutation.isPending}
      >
        <PlayCircle /> Resume
      </Button>
    );
  }

  if (sewingOrder.status !== "in_progress" && sewingOrder.status !== "partially_completed") return null;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PauseCircle /> Hold
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Put {sewingOrder.sewingOrderNumber} on hold</DialogTitle>
            <DialogDescription>Record why sewing is being paused — this shows up on the dashboard and the order&apos;s activity log.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              id="sewing-hold-form"
              onSubmit={form.handleSubmit(async (values) => {
                const reason = `${sewingHoldReasonLabels[values.category]}${values.details ? ` — ${values.details}` : ""}`;
                try {
                  await holdMutation.mutateAsync({ sewingOrder, reason });
                  toast.success(`${sewingOrder.sewingOrderNumber} put on hold`);
                  setOpen(false);
                  form.reset();
                } catch {
                  toast.error("Something went wrong. Please try again.");
                }
              })}
              className="flex flex-col gap-4"
            >
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Reason <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(sewingHoldReasonLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
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
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Details</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="e.g. Machine 4 needs a repair — parts on order" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" form="sewing-hold-form" disabled={holdMutation.isPending}>
              {holdMutation.isPending ? "Saving…" : "Put on Hold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
