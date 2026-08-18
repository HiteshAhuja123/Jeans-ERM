"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { mobilePrimaryNav } from "@/lib/navigation";
import { navBadgeCounts } from "@/lib/derived";
import { MobileNavSheet } from "@/components/shell/mobile-nav-sheet";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Primary"
    >
      {mobilePrimaryNav.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const badgeCount = item.badgeKey ? navBadgeCounts[item.badgeKey] : undefined;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <span className="relative">
              <Icon className="size-5" aria-hidden="true" />
              {!!badgeCount && (
                <span className="absolute -top-1 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-critical text-[9px] font-semibold text-critical-foreground">
                  {badgeCount}
                </span>
              )}
            </span>
            {item.label}
          </Link>
        );
      })}

      <MobileNavSheet
        trigger={
          <button
            type="button"
            className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground"
          >
            <MoreHorizontal className="size-5" aria-hidden="true" />
            More
          </button>
        }
      />
    </nav>
  );
}
