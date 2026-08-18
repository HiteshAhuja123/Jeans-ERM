"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

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
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const unreadCount = mockAlerts.filter((alert) => !readIds.has(alert.id)).length;

  function markRead(id: string) {
    setReadIds((prev) => new Set(prev).add(id));
  }

  function markAllRead() {
    setReadIds(new Set(mockAlerts.map((alert) => alert.id)));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex size-2 rounded-full bg-critical" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span>Alerts</span>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
          ) : (
            <span className="text-xs font-normal text-muted-foreground">All caught up</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-80 overflow-y-auto">
          {mockAlerts.map((alert) => {
            const meta = alertLevelMeta[alert.level];
            const isRead = readIds.has(alert.id);
            return (
              <DropdownMenuItem
                key={alert.id}
                asChild
                className={cn("items-start gap-2.5 px-4 py-3", isRead && "opacity-60")}
              >
                <Link href={alert.href ?? "#"} onClick={() => markRead(alert.id)}>
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      isRead ? "bg-transparent ring-1 ring-muted-foreground" : statusLevelDotClasses[meta.level],
                    )}
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span
                      className={cn(
                        "text-sm text-foreground",
                        isRead ? "font-normal" : "font-medium",
                      )}
                    >
                      {alert.title}
                    </span>
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
