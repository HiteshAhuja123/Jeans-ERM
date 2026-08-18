"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, ShieldCheck, UserPlus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockUsers, roleLabels } from "@/mock-data/users";

const modules = [
  { id: "orders", label: "Orders", description: "Customer & production orders", locked: true },
  { id: "production", label: "Production", description: "Cutting, sewing, washing, finishing", locked: true },
  { id: "inventory", label: "Inventory", description: "Fabric, accessories & finished goods", locked: false },
  { id: "purchasing", label: "Purchasing", description: "Requests, POs & suppliers", locked: false },
  { id: "quality", label: "Quality", description: "Inspections, defects & rework", locked: false },
  { id: "dispatch", label: "Packing & Dispatch", description: "Packing & shipping", locked: false },
];

const notificationPrefs = [
  { id: "low-stock", label: "Low stock alerts", description: "When a material drops below reorder level" },
  { id: "delayed-orders", label: "Delayed order alerts", description: "When an order falls behind schedule" },
  { id: "qc-failures", label: "QC failures", description: "When an inspection fails below 90% pass rate" },
  { id: "approvals", label: "Pending approvals", description: "Purchase requests & rework awaiting sign-off" },
];

export function SettingsView() {
  const [moduleState, setModuleState] = useState<Record<string, boolean>>(
    Object.fromEntries(modules.map((m) => [m.id, true])),
  );
  const [notificationState, setNotificationState] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationPrefs.map((n) => [n.id, true])),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Factory profile, users, modules and notifications" />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Factory Profile</TabsTrigger>
          <TabsTrigger value="users">Users &amp; Roles</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Factory Profile</CardTitle>
              <CardDescription>Shown on packing lists, dispatch notes and reports.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Factory profile updated");
                }}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="factory-name">Factory Name</Label>
                    <Input id="factory-name" defaultValue="ERM Jeans Manufacturing" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="factory-timezone">Timezone</Label>
                    <Input id="factory-timezone" defaultValue="Asia/Kolkata (GMT+5:30)" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="factory-address">Address</Label>
                  <Textarea
                    id="factory-address"
                    rows={2}
                    defaultValue="Plot 14, Industrial Estate, Phase 2, Ludhiana, Punjab, India"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="factory-currency">Default Currency</Label>
                    <Input id="factory-currency" defaultValue="INR (₹)" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="factory-capacity">Daily Production Capacity</Label>
                    <Input id="factory-capacity" defaultValue="1,500 pcs / day" />
                  </div>
                </div>
                <div>
                  <Button type="submit">Save changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Users &amp; Roles</CardTitle>
                <CardDescription>Who has access, and what they can do.</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast("Invites aren't available in this preview build yet.")}
              >
                <UserPlus className="size-4" />
                Invite teammate
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              {mockUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
                    <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Mail className="size-3" /> {user.email}
                    </span>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    <ShieldCheck className="size-3.5" />
                    {roleLabels[user.role]}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Modules</CardTitle>
              <CardDescription>
                Turn workflow modules on or off — the app adapts to how your factory actually runs.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              {modules.map((module) => (
                <div key={module.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">{module.label}</span>
                    <span className="text-xs text-muted-foreground">{module.description}</span>
                  </div>
                  <Switch
                    checked={moduleState[module.id]}
                    disabled={module.locked}
                    onCheckedChange={(checked) =>
                      setModuleState((prev) => ({ ...prev, [module.id]: checked }))
                    }
                    aria-label={`Toggle ${module.label} module`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Choose what raises an alert on your dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              {notificationPrefs.map((pref) => (
                <div key={pref.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">{pref.label}</span>
                    <span className="text-xs text-muted-foreground">{pref.description}</span>
                  </div>
                  <Switch
                    checked={notificationState[pref.id]}
                    onCheckedChange={(checked) =>
                      setNotificationState((prev) => ({ ...prev, [pref.id]: checked }))
                    }
                    aria-label={`Toggle ${pref.label}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
