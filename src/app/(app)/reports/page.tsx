import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Reports",
};

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" description="Production, quality and inventory analytics" />
      <EmptyState
        icon={BarChart3}
        title="Reports are coming in a later phase"
        description="Production trends, quality analytics and export tools will live here once the reporting phase begins."
      />
    </div>
  );
}
