import { CheckCircle2, PackageCheck, Ship, Truck } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { dispatchStatusMeta } from "@/lib/status";
import { mockDispatchRecords } from "@/mock-data";

export function DispatchView() {
  const pending = mockDispatchRecords.filter((d) => d.status === "pending" || d.status === "packed").length;
  const inTransit = mockDispatchRecords.filter((d) => d.status === "in_transit").length;
  const delivered = mockDispatchRecords.filter((d) => d.status === "delivered").length;
  const totalCartons = mockDispatchRecords.reduce((sum, d) => sum + d.cartons, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Packing & Dispatch" description="Finished goods packing status and shipments" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Awaiting Dispatch" value={pending.toString()} icon={PackageCheck} accent="warning" />
        <StatCard label="In Transit" value={inTransit.toString()} icon={Truck} accent="info" />
        <StatCard label="Delivered" value={delivered.toString()} icon={CheckCircle2} accent="success" />
        <StatCard label="Total Cartons" value={totalCartons.toString()} icon={Ship} />
      </div>

      <Card className="hidden overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Cartons</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead className="text-right">Dispatch Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockDispatchRecords.map((record) => {
              const meta = dispatchStatusMeta[record.status];
              return (
                <TableRow key={record.id}>
                  <TableCell className="font-medium text-foreground">{record.orderNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{record.customerName}</TableCell>
                  <TableCell className="text-right tabular-nums text-foreground">
                    {record.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-foreground">{record.cartons}</TableCell>
                  <TableCell>
                    <StatusBadge label={meta.label} level={meta.level} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{record.carrier}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(record.dispatchDate)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <div className="flex flex-col gap-3 md:hidden">
        {mockDispatchRecords.map((record) => {
          const meta = dispatchStatusMeta[record.status];
          return (
            <Card key={record.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{record.orderNumber}</span>
                  <span className="text-xs text-muted-foreground">{record.customerName}</span>
                </div>
                <StatusBadge label={meta.label} level={meta.level} />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {record.quantity.toLocaleString()} pcs · {record.cartons} cartons
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{record.carrier}</span>
                <span>{formatDate(record.dispatchDate)}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
