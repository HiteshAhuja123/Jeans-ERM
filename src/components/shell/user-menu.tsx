"use client";

import { LogOut, Settings, UserCircle } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { currentUser, roleLabels } from "@/mock-data/users";

interface UserMenuProps {
  variant?: "sidebar" | "topbar";
}

export function UserMenu({ variant = "topbar" }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
          variant === "sidebar" && "p-2 hover:bg-sidebar-accent/60",
          variant === "topbar" && "p-1",
        )}
      >
        <Avatar size={variant === "sidebar" ? "default" : "default"}>
          <AvatarFallback className="bg-primary/10 font-semibold text-primary">
            {currentUser.initials}
          </AvatarFallback>
        </Avatar>
        {variant === "sidebar" && (
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {currentUser.name}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              {roleLabels[currentUser.role]}
            </span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={variant === "sidebar" ? "start" : "end"} className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-sm font-medium">{currentUser.name}</span>
          <span className="text-xs font-normal text-muted-foreground">{currentUser.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserCircle className="size-4" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
