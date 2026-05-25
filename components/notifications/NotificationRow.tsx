'use client';

import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/components/notifications/notification-utils';
import type { NotificationRow as NotificationItem } from '@/lib/notifications/types';
import { cn } from '@/lib/utils';

type Props = {
  item: NotificationItem;
  onDelete?: (id: string) => void;
  deleting?: boolean;
  compact?: boolean;
  className?: string;
};

export function NotificationRowItem({
  item,
  onDelete,
  deleting = false,
  compact = false,
  className,
}: Props) {
  return (
    <article
      className={cn(
        'group relative flex gap-2 rounded-xl px-3 py-2.5',
        !item.read && 'bg-muted/60',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className={cn('font-medium text-foreground', compact ? 'text-sm' : 'text-sm')}>{item.title}</p>
        <p className={cn('text-muted-foreground', compact ? 'line-clamp-2 text-xs' : 'mt-0.5 text-sm')}>
          {item.message}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">{formatRelativeTime(item.createdAt)}</p>
      </div>
      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 rounded-lg opacity-70 hover:opacity-100 cursor-pointer"
          aria-label="Delete notification"
          disabled={deleting}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(item.id);
          }}
        >
          <X className="size-3.5" />
        </Button>
      ) : null}
    </article>
  );
}
