import type { Metadata } from "next";

import { MasterDataHubView } from "@/features/master-data-hub/hub-view";

export const metadata: Metadata = {
  title: "Master Data",
};

export default function MastersPage() {
  return <MasterDataHubView />;
}
