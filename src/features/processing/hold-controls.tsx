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
import { processingHoldReasonSchema, type ProcessingHoldReasonValues } from "@/features/processing/schema";
import { processingOrderActionHooks } from "@/features/processing/service";
import { postSewingHoldReasonLabels } from "@/mock-data/post-sewing-reasons";
import type { ProcessingOrder } from "@/types";

export function ProcessingOrderHoldControls({ processingOrder }: { processingOrder: ProcessingOrder }) {
  const [open, setOpen] = useState(false);
  const holdMutation = processingOrderActionHooks.useHold();
  const resumeMutation = processingOrderActionHooks.useResume();

  const form = useForm<ProcessingHoldReasonValues>({
    resolver: zodResolver(processingHoldReasonSchema),
    defaultValues: { category: "supervisor_decision", details: "" },
  });

  if (processingOrder.status === "on_hold") {
    return (
      <Button
        variant="outline"
        onClick={async () => {
          try {
            await resumeMutation.mutateAsync(processingOrder);
            toast.success(`${processingOrder.processingOrderNumber} resumed`);
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

  if (processingOrder.status !== "in_progress" && processingOrder.status !== "partially_received") return null;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PauseCircle /> Hold
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Put {processingOrder.processingOrderNumber} on hold</DialogTitle>
            <DialogDescription>Record why processing is being paused — this shows up on the dashboard and the order&apos;s activity log.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              id="processing-hold-form"
              onSubmit={form.handleSubmit(async (values) => {
                const reason = `${postSewingHoldReasonLabels[values.category]}${values.details ? ` — ${values.details}` : ""}`;
                try {
                  await holdMutation.mutateAsync({ processingOrder, reason });
                  toast.success(`${processingOrder.processingOrderNumber} put on hold`);
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
                        {Object.entries(postSewingHoldReasonLabels).map(([value, label]) => (
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
                      <Textarea rows={3} placeholder="e.g. Vendor reported a 2-day delay" {...field} />
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
            <Button type="submit" form="processing-hold-form" disabled={holdMutation.isPending}>
              {holdMutation.isPending ? "Saving…" : "Put on Hold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
