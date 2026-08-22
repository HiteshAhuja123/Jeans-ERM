import { Activity } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelativeTime } from "@/lib/format";
import type { ActivityItem } from "@/types";

export function ActivityFeedCard({ activity }: { activity: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No recent activity"
            description="Actions across the factory will appear here as they happen."
          />
        ) : (
          <ol className="flex flex-col">
            {activity.map((item, index) => (
              <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
                {index < activity.length - 1 && (
                  <span className="absolute top-2.5 left-[5px] h-full w-px bg-border" aria-hidden="true" />
                )}
                <span className="relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-primary bg-card" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm text-foreground">
                    <span className="font-medium">{item.actor}</span> — {item.action}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.target} · {formatRelativeTime(item.timestamp)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
