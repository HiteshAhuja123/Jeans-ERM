import type { Metadata } from "next";

import { PurchasingView } from "@/features/purchasing/purchasing-view";

export const metadata: Metadata = {
  title: "Purchasing",
};

export default function PurchasingPage() {
  return <PurchasingView />;
}
