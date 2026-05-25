'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { NotificationRowItem } from '@/components/notifications/NotificationRow';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import type { NotificationRow } from '@/lib/notifications/types';

type Props = {
  initialItems: NotificationRow[];
  initialTotal: number;
  initialUnread: number;
  page: number;
  pageSize: number;
};

function buildNotificationsUrl(page: number): string {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  const q = params.toString();
  return q ? `/notifications?${q}` : '/notifications';
}

export function NotificationsList({
  initialItems,
  initialTotal,
  initialUnread,
  page,
  pageSize,
}: Props) {
  const router = useRouter();
  const [items, setItems] = React.useState(initialItems);
  const [unreadCount, setUnreadCount] = React.useState(initialUnread);
  const [total, setTotal] = React.useState(initialTotal);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [markingAll, setMarkingAll] = React.useState(false);
  const [deletingAll, setDeletingAll] = React.useState(false);

  React.useEffect(() => {
    setItems(initialItems);
    setTotal(initialTotal);
    setUnreadCount(initialUnread);
  }, [initialItems, initialTotal, initialUnread]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Could not delete notification');
        return;
      }
      const next = items.filter((n) => n.id !== id);
      setItems(next);
      setTotal((t) => Math.max(0, t - 1));
      const removed = items.find((n) => n.id === id);
      if (removed && !removed.read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      if (next.length === 0 && page > 1) {
        router.push(buildNotificationsUrl(page - 1));
      } else {
        router.refresh();
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingId(null);
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications/mark-read', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) {
        toast.error('Could not mark all as read');
        return;
      }
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } finally {
      setMarkingAll(false);
    }
  }

  async function deleteAll() {
    if (items.length === 0 && total === 0) return;
    setDeletingAll(true);
    try {
      const res = await fetch('/api/notifications/delete-all', { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Could not delete notifications');
        return;
      }
      setItems([]);
      setTotal(0);
      setUnreadCount(0);
      toast.success('All notifications deleted');
      router.push('/notifications');
      router.refresh();
    } finally {
      setDeletingAll(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl cursor-pointer"
            disabled={markingAll}
            onClick={() => void markAllRead()}
          >
            {markingAll ? 'Marking…' : 'Mark all as read'}
          </Button>
        ) : null}
        {total > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl text-destructive hover:text-destructive cursor-pointer"
            disabled={deletingAll}
            onClick={() => void deleteAll()}
          >
            {deletingAll ? 'Deleting…' : 'Delete all'}
          </Button>
        ) : null}
        {unreadCount > 0 ? (
          <span className="text-sm text-muted-foreground">{unreadCount} unread</span>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-border dark:border-border/50 shadow-sm bg-background dark:bg-[#1c1c1c]  px-6 py-16 text-center">
          <p className="text-base font-semibold text-foreground">No notifications</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Risk alerts and watchlist updates will appear here.
          </p>
          <Link href="/dashboard" className="mt-6 inline-flex">
            <Button variant="outline" className="rounded-xl cursor-pointer">
              Go to dashboard
            </Button>
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card dark:bg-[#1c1c1c]">
          {items.map((item) => (
            <li key={item.id} className="list-none">
              <NotificationRowItem
                item={item}
                onDelete={(id) => void handleDelete(id)}
                deleting={deletingId === item.id}
              />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={safePage > 1 ? buildNotificationsUrl(safePage - 1) : '#'}
                aria-disabled={safePage <= 1}
                className={safePage <= 1 ? 'pointer-events-none opacity-50' : undefined}
                onClick={(e) => {
                  if (safePage <= 1) e.preventDefault();
                }}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev !== undefined && p - prev > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis ? (
                      <PaginationItem>
                        <span className="px-2 text-muted-foreground">…</span>
                      </PaginationItem>
                    ) : null}
                    <PaginationItem>
                      <PaginationLink href={buildNotificationsUrl(p)} isActive={p === safePage}>
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  </React.Fragment>
                );
              })}
            <PaginationItem>
              <PaginationNext
                href={safePage < totalPages ? buildNotificationsUrl(safePage + 1) : '#'}
                aria-disabled={safePage >= totalPages}
                className={safePage >= totalPages ? 'pointer-events-none opacity-50' : undefined}
                onClick={(e) => {
                  if (safePage >= totalPages) e.preventDefault();
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
