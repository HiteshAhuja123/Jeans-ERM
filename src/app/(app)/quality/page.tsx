import type { Metadata } from "next";

import { QualityView } from "@/features/quality/quality-view";

export const metadata: Metadata = {
  title: "Quality",
};

export default function QualityPage() {
  return <QualityView />;
}
