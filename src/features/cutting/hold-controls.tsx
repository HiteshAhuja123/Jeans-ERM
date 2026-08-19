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
import { Textarea } from "@/components/ui/textarea";
import { holdReasonSchema, type HoldReasonValues } from "@/features/cutting/schema";
import { cuttingBatchActionHooks, cuttingOrderActionHooks } from "@/features/cutting/service";
import type { CuttingBatch, CuttingOrder } from "@/types";

function HoldReasonDialog({
  open,
  onOpenChange,
  title,
  isSubmitting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  isSubmitting: boolean;
  onConfirm: (values: HoldReasonValues) => void;
}) {
  const form = useForm<HoldReasonValues>({ resolver: zodResolver(holdReasonSchema), defaultValues: { reason: "" } });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Record why this is being paused — e.g. material shortage, machine issue, pattern correction.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="hold-reason-form"
            onSubmit={form.handleSubmit((values) => {
              onConfirm(values);
              form.reset();
            })}
          >
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Reason <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="e.g. Material shortage — awaiting second fabric issue" {...field} />
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
          <Button type="submit" form="hold-reason-form" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Put on Hold"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CuttingOrderHoldControls({ cuttingOrder }: { cuttingOrder: CuttingOrder }) {
  const [open, setOpen] = useState(false);
  const holdMutation = cuttingOrderActionHooks.useHold();
  const resumeMutation = cuttingOrderActionHooks.useResume();

  if (cuttingOrder.status === "on_hold") {
    return (
      <Button
        variant="outline"
        onClick={async () => {
          try {
            await resumeMutation.mutateAsync(cuttingOrder);
            toast.success(`${cuttingOrder.cuttingOrderNumber} resumed`);
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

  if (cuttingOrder.status !== "in_progress") return null;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PauseCircle /> Hold
      </Button>
      <HoldReasonDialog
        open={open}
        onOpenChange={setOpen}
        title={`Put ${cuttingOrder.cuttingOrderNumber} on hold`}
        isSubmitting={holdMutation.isPending}
        onConfirm={async (values) => {
          try {
            await holdMutation.mutateAsync({ cuttingOrder, reason: values.reason });
            toast.success(`${cuttingOrder.cuttingOrderNumber} put on hold`);
            setOpen(false);
          } catch {
            toast.error("Something went wrong. Please try again.");
          }
        }}
      />
    </>
  );
}

export function CuttingBatchHoldControls({ batch }: { batch: CuttingBatch }) {
  const [open, setOpen] = useState(false);
  const holdMutation = cuttingBatchActionHooks.useHold();
  const resumeMutation = cuttingBatchActionHooks.useResume();

  if (batch.status === "on_hold") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            await resumeMutation.mutateAsync(batch);
            toast.success(`${batch.batchNumber} resumed`);
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

  if (batch.status !== "in_progress") return null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PauseCircle /> Hold
      </Button>
      <HoldReasonDialog
        open={open}
        onOpenChange={setOpen}
        title={`Put ${batch.batchNumber} on hold`}
        isSubmitting={holdMutation.isPending}
        onConfirm={async (values) => {
          try {
            await holdMutation.mutateAsync({ batch, reason: values.reason });
            toast.success(`${batch.batchNumber} put on hold`);
            setOpen(false);
          } catch {
            toast.error("Something went wrong. Please try again.");
          }
        }}
      />
    </>
  );
}
