import type { Metadata } from "next";

import { ProductionView } from "@/features/production/production-view";

export const metadata: Metadata = {
  title: "Production",
};

export default function ProductionPage() {
  return <ProductionView />;
}
