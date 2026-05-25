"use client";

import { CreditCard, Home, History, Eye, GitCompareArrows, Settings, ShieldCheck, Star, Bot } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/history", label: "History", icon: History },
  { href: "/watchlist", label: "Watchlist", icon: Eye },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/guardian", label: "Guardian", icon: Bot },
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/settings", label: "Settings", icon: Settings },
];

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

export function DashboardSidebar({ userData }: { userData: UserData }) {
  const pathname = usePathname();
  const { email, fullName, avatarUrl, checksUsed, monthlyLimit, subscriptionPlan, subscriptionStatus } = userData;

  // Для аватара: используем fullName или email для инициалов
  const getInitials = () => {
    if (fullName && fullName.trim()) {
      const names = fullName.trim().split(" ");
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return names[0].slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  // Display name: fullName или email
  const displayName = fullName || email;
  const planLabel = displayPlan(subscriptionPlan, subscriptionStatus);
  const used = Math.max(0, checksUsed);
  const limit = Math.max(1, monthlyLimit);
  const progress = Math.min(100, Math.round((used / limit) * 100));

  return (
    <aside className="hidden w-72 shrink-0 border-r border-zinc-200/70 dark:border-border bg-background lg:flex lg:flex-col max-h-screen overflow-hidden ">
      <div className="flex items-center gap-3 px-7 py-8">
        <div className="rounded-xl border border-zinc-200 dark:border-border p-2.5">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm text-zinc-500">Workspace</p>
          <p className="font-semibold tracking-tight">Tradefend</p>
        </div>
      </div>

    

      <nav className="space-y-2 px-4 py-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 transition hover:bg-zinc-100/70 hover:text-zinc-900 dark:hover:text-zinc-900",
                isActive && "bg-muted font-medium text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-5 pb-6">
        <div className="rounded-2xl border border-zinc-200/80 bg-card p-4 shadow-sm dark:border-border">
          <div className="mb-3 flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{email}</p>
            </div>
          </div>
          <Badge variant="secondary" className="rounded-full px-2.5 py-1">
            {planLabel}
          </Badge>
          <div className="mt-4 space-y-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {used} / {limit} checks used
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <Link
            href="/pricing"
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-zinc-700 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Manage plan
          </Link>
        </div>
      </div>
    </aside>
  );
}