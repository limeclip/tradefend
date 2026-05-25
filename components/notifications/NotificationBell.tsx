'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

import { NotificationRowItem } from '@/components/notifications/NotificationRow';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { NotificationRow } from '@/lib/notifications/types';
import { cn } from '@/lib/utils';

const BELL_LIMIT = 10;

type NotificationsResponse = {
  notifications: NotificationRow[];
  unreadCount: number;
};

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [markingAll, setMarkingAll] = React.useState(false);
  const [deletingAll, setDeletingAll] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const loadNotifications = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?limit=${BELL_LIMIT}&page=1`, { method: 'GET' });
      if (!res.ok) return;
      const json = (await res.json()) as NotificationsResponse;
      setItems(json.notifications ?? []);
      setUnreadCount(json.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  React.useEffect(() => {
    if (open) {
      void loadNotifications();
    }
  }, [open, loadNotifications]);

  async function markAllRead() {
    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications/mark-read', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) return;
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } finally {
      setMarkingAll(false);
    }
  }

  async function deleteAll() {
    setDeletingAll(true);
    try {
      const res = await fetch('/api/notifications/delete-all', { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Could not delete notifications');
        return;
      }
      setItems([]);
      setUnreadCount(0);
      toast.success('All notifications deleted');
    } finally {
      setDeletingAll(false);
    }
  }

  async function deleteOne(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Could not delete');
        return;
      }
      const removed = items.find((n) => n.id === id);
      setItems((prev) => prev.filter((n) => n.id !== id));
      if (removed && !removed.read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } finally {
      setDeletingId(null);
    }
  }

  const hasItems = items.length > 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          'relative inline-flex size-9 items-center justify-center rounded-xl cursor-pointer',
          'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        )}
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-2xl p-0">
        <DropdownMenuGroup>
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
            <DropdownMenuLabel className="p-0 text-sm font-semibold text-foreground">
              Notifications
            </DropdownMenuLabel>
            <div className="flex flex-wrap gap-1">
              {unreadCount > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-lg px-2 text-xs cursor-pointer"
                  disabled={markingAll}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void markAllRead();
                  }}
                >
                  {markingAll ? '…' : 'Mark all read'}
                </Button>
              ) : null}
              {hasItems ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-lg px-2 text-xs text-destructive hover:text-destructive cursor-pointer"
                  disabled={deletingAll}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void deleteAll();
                  }}
                >
                  {deletingAll ? '…' : 'Delete all'}
                </Button>
              ) : null}
            </div>
          </div>
          <DropdownMenuSeparator />
          <div className="max-h-80 overflow-y-auto py-1">
            {loading && items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet</p>
            ) : (
              items.map((item) => (
                <NotificationRowItem
                  key={item.id}
                  item={item}
                  compact
                  className="mx-1"
                  deleting={deletingId === item.id}
                  onDelete={(id) => void deleteOne(id)}
                />
              ))
            )}
          </div>
          <DropdownMenuSeparator />
          <div className="p-2">
            <Link
              href="/notifications"
              className={cn(buttonVariants({ variant: 'ghost' }), 'h-9 w-full rounded-xl text-sm')}
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
