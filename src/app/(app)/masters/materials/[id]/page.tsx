import type { Metadata } from "next";
import { Suspense } from "react";

import { MaterialDetailView } from "@/features/materials/material-detail-view";
import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export const metadata: Metadata = {
  title: "Material Details",
};

export default async function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<ListPageSkeleton statCards={0} />}>
      <MaterialDetailView id={id} />
    </Suspense>
  );
}
