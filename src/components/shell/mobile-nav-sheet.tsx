"use client";

import { useState } from "react";
import { Menu, Shirt } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navGroups } from "@/lib/navigation";
import { NavLink } from "@/components/shell/nav-link";
import { UserMenu } from "@/components/shell/user-menu";

interface MobileNavSheetProps {
  trigger: React.ReactNode;
}

export function MobileNavSheet({ trigger }: MobileNavSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="border-b border-sidebar-border">
          <SheetTitle className="flex items-center gap-2.5 text-left">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shirt className="size-4.5" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-sidebar-foreground">ERM Jeans</span>
              <span className="text-[11px] font-normal text-sidebar-foreground/60">
                Factory Management
              </span>
            </span>
          </SheetTitle>
        </SheetHeader>
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-5">
            {navGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-1">
                <span className="px-3 text-[11px] font-semibold tracking-wide text-sidebar-foreground/45 uppercase">
                  {group.label}
                </span>
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} onNavigate={() => setOpen(false)} />
                ))}
              </div>
            ))}
          </div>
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <UserMenu variant="sidebar" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MobileMenuTrigger() {
  return (
    <MobileNavSheet
      trigger={
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
          <Menu className="size-5" />
        </Button>
      }
    />
  );
}
