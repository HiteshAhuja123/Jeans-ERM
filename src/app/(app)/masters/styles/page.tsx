import type { Metadata } from "next";
import { Suspense } from "react";

import { StylesListView } from "@/features/styles/styles-list-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Styles",
};

export default function StylesPage() {
  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <StylesListView />
    </Suspense>
  );
}
