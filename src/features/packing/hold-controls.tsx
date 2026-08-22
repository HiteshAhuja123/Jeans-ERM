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
import { packingHoldReasonSchema, type PackingHoldReasonValues } from "@/features/packing/schema";
import { packingOrderActionHooks } from "@/features/packing/service";
import { postSewingHoldReasonLabels } from "@/mock-data/post-sewing-reasons";
import type { PackingOrder } from "@/types";

export function PackingOrderHoldControls({ packingOrder }: { packingOrder: PackingOrder }) {
  const [open, setOpen] = useState(false);
  const holdMutation = packingOrderActionHooks.useHold();
  const resumeMutation = packingOrderActionHooks.useResume();

  const form = useForm<PackingHoldReasonValues>({
    resolver: zodResolver(packingHoldReasonSchema),
    defaultValues: { category: "supervisor_decision", details: "" },
  });

  if (packingOrder.status === "on_hold") {
    return (
      <Button
        variant="outline"
        onClick={async () => {
          try {
            await resumeMutation.mutateAsync(packingOrder);
            toast.success(`${packingOrder.packingOrderNumber} resumed`);
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

  if (packingOrder.status !== "in_progress" && packingOrder.status !== "partially_packed") return null;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PauseCircle /> Hold
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Put {packingOrder.packingOrderNumber} on hold</DialogTitle>
            <DialogDescription>Record why packing is being paused — this shows up on the dashboard and the order&apos;s activity log.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              id="packing-hold-form"
              onSubmit={form.handleSubmit(async (values) => {
                const reason = `${postSewingHoldReasonLabels[values.category]}${values.details ? ` — ${values.details}` : ""}`;
                try {
                  await holdMutation.mutateAsync({ packingOrder, reason });
                  toast.success(`${packingOrder.packingOrderNumber} put on hold`);
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
                      <Textarea rows={3} placeholder="e.g. Carton stock ran out on the floor" {...field} />
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
            <Button type="submit" form="packing-hold-form" disabled={holdMutation.isPending}>
              {holdMutation.isPending ? "Saving…" : "Put on Hold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
