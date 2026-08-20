import type { Metadata } from "next";
import { Suspense } from "react";

import { SewingBundleQueueView } from "@/features/sewing/sewing-bundle-queue-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = { title: "Sewing Work Queue" };

export default function SewingBundlesPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <SewingBundleQueueView />
    </Suspense>
  );
}
