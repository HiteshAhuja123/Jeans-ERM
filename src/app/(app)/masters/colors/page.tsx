import type { Metadata } from "next";
import { Suspense } from "react";

import { ColorsView } from "@/features/colors/colors-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Colors",
};

export default function ColorsPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <ColorsView />
    </Suspense>
  );
}
