"use client";

import { useId } from "react";
import type { FormEvent, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface EntityFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  children: ReactNode;
}

export function EntityFormSheet({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  isSubmitting,
  submitLabel = "Save",
  children,
}: EntityFormSheetProps) {
  const formId = useId();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <form id={formId} onSubmit={onSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
          {children}
        </form>
        <SheetFooter className="flex-row justify-end gap-2 border-t border-border">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : submitLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
