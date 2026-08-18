import type { Metadata } from "next";
import { Suspense } from "react";

import { ProcessesView } from "@/features/processes/processes-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Processes",
};

export default function ProcessesPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <ProcessesView />
    </Suspense>
  );
}
