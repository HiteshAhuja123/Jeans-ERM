import type { Metadata } from "next";
import { Suspense } from "react";

import { MachinesView } from "@/features/machines/machines-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Machines",
};

export default function MachinesPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <MachinesView />
    </Suspense>
  );
}
