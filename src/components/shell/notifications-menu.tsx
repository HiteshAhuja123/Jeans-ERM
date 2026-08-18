"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import { alertLevelMeta, statusLevelDotClasses } from "@/lib/status";
import { mockAlerts } from "@/mock-data";

export function NotificationsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {mockAlerts.length > 0 && (
            <span className="absolute top-1.5 right-1.5 flex size-2 rounded-full bg-critical" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span>Alerts</span>
          <span className="text-xs font-normal text-muted-foreground">
            {mockAlerts.length} open
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-80 overflow-y-auto">
          {mockAlerts.map((alert) => {
            const meta = alertLevelMeta[alert.level];
            return (
              <DropdownMenuItem key={alert.id} asChild className="items-start gap-2.5 px-4 py-3">
                <Link href={alert.href ?? "#"}>
                  <span
                    className={cn("mt-1.5 size-2 shrink-0 rounded-full", statusLevelDotClasses[meta.level])}
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{alert.title}</span>
                    <span className="text-xs text-muted-foreground">{alert.description}</span>
                    <span className="text-[11px] text-muted-foreground/80">
                      {alert.module} · {formatRelativeTime(alert.timestamp)}
                    </span>
                  </span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
