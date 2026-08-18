import Link from "next/link";
import { Bell } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelativeTime } from "@/lib/format";
import { alertLevelMeta, statusLevelDotClasses } from "@/lib/status";
import type { AlertItem } from "@/types";

export function AlertsCard({
  alerts,
  viewAllHref = "/inventory",
}: {
  alerts: AlertItem[];
  viewAllHref?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Alerts</CardTitle>
        <Link href={viewAllHref} className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {alerts.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No alerts"
            description="You're all caught up — nothing needs attention right now."
          />
        ) : (
          alerts.map((alert) => {
            const meta = alertLevelMeta[alert.level];
            return (
              <Link
                key={alert.id}
                href={alert.href ?? "#"}
                className="flex items-start gap-2.5 rounded-lg px-2 py-2.5 -mx-2 transition-colors hover:bg-muted"
              >
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${statusLevelDotClasses[meta.level]}`}
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{alert.title}</span>
                  <span className="text-xs text-muted-foreground">{alert.description}</span>
                  <span className="text-[11px] text-muted-foreground/80">
                    {alert.module} · {formatRelativeTime(alert.timestamp)}
                  </span>
                </span>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
