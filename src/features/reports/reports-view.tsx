"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrdersProductionReport } from "@/features/reports/orders-production-report";
import { InventoryPurchasingReport } from "@/features/reports/inventory-purchasing-report";
import { QualityReworkReport } from "@/features/reports/quality-rework-report";
import { FinishedGoodsDispatchReport } from "@/features/reports/finished-goods-dispatch-report";
import { ActivityReport } from "@/features/reports/activity-report";

export function ReportsView() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" description="Production, quality and inventory analytics across the factory" />

      <Tabs defaultValue="orders-production">
        <TabsList className="flex-wrap">
          <TabsTrigger value="orders-production">Orders & Production</TabsTrigger>
          <TabsTrigger value="inventory-purchasing">Inventory & Purchasing</TabsTrigger>
          <TabsTrigger value="quality-rework">Quality & Rework</TabsTrigger>
          <TabsTrigger value="finished-goods-dispatch">Finished Goods & Dispatch</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="orders-production" className="mt-4">
          <OrdersProductionReport />
        </TabsContent>
        <TabsContent value="inventory-purchasing" className="mt-4">
          <InventoryPurchasingReport />
        </TabsContent>
        <TabsContent value="quality-rework" className="mt-4">
          <QualityReworkReport />
        </TabsContent>
        <TabsContent value="finished-goods-dispatch" className="mt-4">
          <FinishedGoodsDispatchReport />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ActivityReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
