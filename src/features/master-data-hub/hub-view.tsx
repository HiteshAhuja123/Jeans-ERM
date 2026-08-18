"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Building,
  Cog,
  ListOrdered,
  Palette,
  Ruler,
  Scale,
  Shirt,
  Tags,
  Truck,
  Users,
  Warehouse as WarehouseIcon,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import {
  mockColors,
  mockCustomers,
  mockDepartments,
  mockEmployees,
  mockMachines,
  mockMaterials,
  mockProcesses,
  mockProductionLineMasters,
  mockProducts,
  mockSizes,
  mockSkus,
  mockStyles,
  mockSuppliers,
  mockUnitsOfMeasure,
  mockWarehouses,
} from "@/mock-data";

interface HubEntity {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  count: number;
}

interface HubGroup {
  label: string;
  entities: HubEntity[];
}

const groups: HubGroup[] = [
  {
    label: "Business Partners",
    entities: [
      { label: "Customers", description: "Brands, retailers & wholesalers", href: "/masters/customers", icon: Building, count: mockCustomers.length },
      { label: "Suppliers", description: "Fabric, accessories & vendors", href: "/masters/suppliers", icon: Truck, count: mockSuppliers.length },
    ],
  },
  {
    label: "Product Data",
    entities: [
      { label: "Products", description: "Finished jeans product lines", href: "/masters/products", icon: Shirt, count: mockProducts.length },
      { label: "Styles", description: "Fit, fabric & default operations", href: "/masters/styles", icon: Ruler, count: mockStyles.length },
      { label: "SKUs", description: "Style + color + size combinations", href: "/masters/skus", icon: Tags, count: mockSkus.length },
      { label: "Sizes", description: "Configurable size range", href: "/masters/sizes", icon: Ruler, count: mockSizes.length },
      { label: "Colors", description: "Configurable color palette", href: "/masters/colors", icon: Palette, count: mockColors.length },
    ],
  },
  {
    label: "Materials",
    entities: [
      { label: "Materials", description: "Fabric, accessories, thread & packaging", href: "/masters/materials", icon: Boxes, count: mockMaterials.length },
      { label: "Units of Measurement", description: "PCS, KG, Meter, Roll & more", href: "/masters/uom", icon: Scale, count: mockUnitsOfMeasure.length },
    ],
  },
  {
    label: "Facilities",
    entities: [
      { label: "Warehouses", description: "Warehouses & their storage locations", href: "/masters/warehouses", icon: WarehouseIcon, count: mockWarehouses.length },
    ],
  },
  {
    label: "Workforce & Operations",
    entities: [
      { label: "Departments", description: "Production, purchase, QC & more", href: "/masters/departments", icon: Building, count: mockDepartments.length },
      { label: "Production Lines", description: "Lines within each department", href: "/masters/production-lines", icon: Boxes, count: mockProductionLineMasters.length },
      { label: "Machines", description: "Machines by department & line", href: "/masters/machines", icon: Cog, count: mockMachines.length },
      { label: "Employees", description: "Operational staff master", href: "/masters/employees", icon: Users, count: mockEmployees.length },
      { label: "Processes", description: "Configurable operations", href: "/masters/processes", icon: ListOrdered, count: mockProcesses.length },
    ],
  },
];

export function MasterDataHubView() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Master Data" description="The foundational business data every other module in ERM Jeans builds on" />

      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{group.label}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.entities.map((entity) => (
              <Link key={entity.href} href={entity.href}>
                <Card className="flex h-full flex-row items-center gap-3 p-4 transition-colors hover:border-primary/40 hover:shadow-sm">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <entity.icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground">{entity.label}</span>
                      <span className="text-xs font-medium text-muted-foreground">{entity.count}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{entity.description}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
