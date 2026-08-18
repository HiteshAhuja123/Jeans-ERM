import { CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import type { ApprovalItem } from "@/types";

export function ApprovalsCard({ approvals }: { approvals: ApprovalItem[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Pending Approvals</CardTitle>
        <span className="text-xs font-medium text-muted-foreground">{approvals.length} waiting</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {approvals.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nothing to approve"
            description="New purchase requests and rework plans will show up here."
          />
        ) : (
          approvals.map((approval) => (
            <div
              key={approval.id}
              className="flex flex-col gap-2 rounded-lg px-2 py-2.5 -mx-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs font-medium text-primary">{approval.type}</span>
                <span className="truncate text-sm font-medium text-foreground">{approval.title}</span>
                <span className="text-xs text-muted-foreground">
                  {approval.requestedBy} · {formatRelativeTime(approval.timestamp)}
                  {approval.amount ? ` · ${formatCurrency(approval.amount)}` : ""}
                </span>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline">
                  Reject
                </Button>
                <Button size="sm">Approve</Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
