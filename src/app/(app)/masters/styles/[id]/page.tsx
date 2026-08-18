import type { Metadata } from "next";
import { Suspense } from "react";

import { StyleDetailView } from "@/features/styles/style-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Style Details",
};

export default async function StyleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <StyleDetailView id={id} />
    </Suspense>
  );
}
