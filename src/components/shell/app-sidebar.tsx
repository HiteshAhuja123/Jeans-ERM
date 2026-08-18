"use client";

import Link from "next/link";
import { Shirt } from "lucide-react";

import { navGroups } from "@/lib/navigation";
import { NavLink } from "@/components/shell/nav-link";
import { UserMenu } from "@/components/shell/user-menu";

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Shirt className="size-4.5" aria-hidden="true" />
        </span>
        <Link href="/dashboard" className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-sidebar-foreground">ERM Jeans</span>
          <span className="text-[11px] text-sidebar-foreground/60">Factory Management</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-5">
          {navGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <span className="px-3 text-[11px] font-semibold tracking-wide text-sidebar-foreground/45 uppercase">
                {group.label}
              </span>
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <UserMenu variant="sidebar" />
      </div>
    </aside>
  );
}
