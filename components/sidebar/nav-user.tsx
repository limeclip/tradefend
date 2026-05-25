"use client";

import {
  BadgeCheck,
  Check,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Palette,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { signOut } from "@/app/(app)/actions";

type UserData = {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string;
  checksUsed: number;
  monthlyLimit: number;
};

function displayPlan(plan: string, status: string): string {
  if (status !== "active") return "Free";
  if (plan === "pro_monthly") return "Pro Monthly";
  if (plan === "pro_yearly") return "Pro Yearly";
  return "Free";
}

export function NavUser({ user }: { user: UserData }) {
  const { isMobile } = useSidebar();
  const { email, fullName, avatarUrl, subscriptionPlan, subscriptionStatus, checksUsed, monthlyLimit } = user;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const getInitials = () => {
    if (fullName && fullName.trim()) {
      const names = fullName.trim().split(" ");
      if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase();
      return names[0].slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const displayName = fullName || email;
  const planLabel = displayPlan(subscriptionPlan, subscriptionStatus);
  const used = Math.max(0, checksUsed);
  const limit = Math.max(1, monthlyLimit);
  const progress = Math.min(100, Math.round((used / limit) * 100));

  const isFree = subscriptionStatus !== "active";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <div
              className={cn(
                "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground cursor-pointer",
                "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                "h-12 text-sm group-data-[collapsible=icon]:p-0!"
              )}
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                <AvatarFallback className="rounded-lg">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                    <AvatarFallback className="rounded-lg">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs">{email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground">{planLabel}</span>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {used} / {limit} checks used
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />

            {/* Upgrade to Pro – только для Free */}
            {isFree && (
              <>
                <DropdownMenuGroup>
                  <Link href="/pricing">
                    <DropdownMenuItem className="py-1.5 cursor-pointer gap-2.5">
                      <Sparkles className="text-muted-foreground" />
                      Upgrade to Pro
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuGroup>
              <Link href="/pricing">
                <DropdownMenuItem className="py-1.5 cursor-pointer gap-2.5">
                  <CreditCard className="text-muted-foreground" />
                  Manage plan
                </DropdownMenuItem>
              </Link>
              <Link href="/settings">
                <DropdownMenuItem className="py-1.5 cursor-pointer gap-2.5">
                  <BadgeCheck className="text-muted-foreground" />
                  Settings
                </DropdownMenuItem>
              </Link>
              {/* Appearance с подменю (выбор темы) */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer gap-2.5 py-1.5">
                  <Palette className="text-muted-foreground" />
                  <span>Appearance</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme("light")} className="flex justify-between cursor-pointer">
                    Light
                    {mounted && theme === "light" && <Check className="ml-2 h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")} className="flex justify-between cursor-pointer">
                    Dark
                    {mounted && theme === "dark" && <Check className="ml-2 h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")} className="flex justify-between cursor-pointer">
                    System
                    {mounted && theme === "system" && <Check className="ml-2 h-4 w-4" />}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <form action={signOut} className="w-full">
                <Button type="submit" variant="ghost" className="w-full cursor-pointer justify-start ">
                  <LogOut className="-ml-2 text-muted-foreground" />
                  Log out
                </Button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}