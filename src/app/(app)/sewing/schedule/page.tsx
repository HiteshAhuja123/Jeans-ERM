import type { Metadata } from "next";
import { Suspense } from "react";

import { SewingScheduleView } from "@/features/sewing/sewing-schedule-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Sewing Schedule" };

export default function SewingSchedulePage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <SewingScheduleView />
    </Suspense>
  );
}
