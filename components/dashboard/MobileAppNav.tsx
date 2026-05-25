'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { History, Home, Eye, GitCompareArrows, Menu, Settings, ShieldCheck, X, Bot } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/history', label: 'History', icon: History },
  { href: '/watchlist', label: 'Watchlist', icon: Eye },
  { href: '/compare', label: 'Compare', icon: GitCompareArrows },
  { href: '/guardian', label: 'Guardian', icon: Bot },
  { href: '/settings', label: 'Settings', icon: Settings },
];

type UserData = {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export function MobileAppNav({ userData }: { userData: UserData }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { email, fullName, avatarUrl } = userData;

  const getInitials = () => {
    if (fullName && fullName.trim()) {
      const names = fullName.trim().split(' ');
      if (names.length >= 2) {
        return (names[0]![0] + names[1]![0]).toUpperCase();
      }
      return names[0]!.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const displayName = fullName || email;

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="flex items-center lg:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="rounded-xl border-border"
        aria-expanded={open}
        aria-controls="mobile-app-nav"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" id="mobile-app-nav">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/55"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside
            className={cn(
              'absolute left-0 top-0 flex h-full w-[min(88vw,320px)] flex-col border-r border-border bg-background shadow-xl',
              'animate-in slide-in-from-left duration-200',
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-border p-2.5">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Workspace</p>
                  <p className="font-semibold tracking-tight">PreTrade</p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" className="rounded-xl" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm transition-colors',
                      isActive
                        ? 'bg-muted font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-border p-4">
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
                <Avatar className="size-9">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
