"use client";

import * as React from "react";
import { Home, History, Eye, GitCompareArrows, Star, Settings, ShieldCheck, Bot, Bell } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { usePathname } from "next/navigation";
import { NavResearch } from "./nav-research";
import { NavTrading } from "./nav-trading";
import { NavAccount } from "./nav-account";
import Image from "next/image";
import Link from "next/link";

type UserData = {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string;
  checksUsed: number;
  monthlyLimit: number;
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: UserData;
};



export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();


  // Реальные пункты меню (заменяем демо-данные)
  const navMainItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard",
      items: [],
    },
    {
      title: "History",
      url: "/history",
      icon: History,
      isActive: pathname === "/history",
      items: [],
    },
   
   
  
  ];

  const navResearchItems = [
    {
      title: "Watchlist",
      url: "/watchlist",
      icon: Eye,
      isActive: pathname === "/watchlist",
      items: [],
    },
    {
      title: "Compare",
      url: "/compare",
      icon: GitCompareArrows,
      isActive: pathname === "/compare",
      items: [],
    },
    {
      title: "Safe List",
      url: "/safe-list",
      icon: ShieldCheck,
      isActive: pathname === "/safe-list",
      items: [],
    },
  ];
  const navTradingItems = [
    {
      title: "Guardian",
      url: "/guardian",
      icon: Bot,
      isActive: pathname === "/guardian",
      items: [],
    },
   
    {
      title: "Favorites",
      url: "/favorites",
      icon: Star,
      isActive: pathname === "/favorites",
      items: [],
    },
  ];
  const navAccountItems = [
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
      isActive: pathname === "/notifications",
      items: [],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      isActive: pathname === "/settings",
      items: [],
    },
  ];
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="pt-2 pb-2">
          <Link href={'/'}>
          <div className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center text-sidebar-primary-foreground">
            <Image
            src={"/logo-d.png"}
            alt="Tradefend"
            width={500}
            height={600}
            className="w-7 h-auto hidden dark:block"
          />
          <Image
            src={"/logo.png"}
            alt="Tradefend"
            width={500}
            height={600}
            className="w-7 h-auto block dark:hidden"
          />
              {/* <ShieldCheck className="h-6 w-6 text-foreground" /> */}
            </div>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-semibold tracking-tight text-foreground">Tradefend</span>
            </div>
          </div>
          </Link>
        </div>
        {/* <TeamSwitcher teams={data.teams} /> */}
      </SidebarHeader>
      <SidebarContent className="gap-1">
        <NavMain items={navMainItems} />
        <NavResearch items={navResearchItems} />
        <NavTrading items={navTradingItems} />
        <NavAccount items={navAccountItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}