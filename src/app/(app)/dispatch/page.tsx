import type { Metadata } from "next";

import { DispatchView } from "@/features/dispatch/dispatch-view";

export const metadata: Metadata = {
  title: "Packing & Dispatch",
};

export default function DispatchPage() {
  return <DispatchView />;
}
