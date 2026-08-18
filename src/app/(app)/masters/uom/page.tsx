import type { Metadata } from "next";
import { Suspense } from "react";

import { UomView } from "@/features/uom/uom-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Units of Measurement",
};

export default function UomPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <UomView />
    </Suspense>
  );
}
