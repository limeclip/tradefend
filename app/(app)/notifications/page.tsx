import { redirect } from 'next/navigation';
import { NotificationsList } from '@/components/notifications/NotificationsList';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { NotificationRow } from '@/lib/notifications/types';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function parsePage(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = v ? Number.parseInt(v, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const page = parsePage(sp.page);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true },
  });

  if (!dbUser) {
    return (
      <NotificationsPageShell page={1}>
        <NotificationsList
          initialItems={[]}
          initialTotal={0}
          initialUnread={0}
          page={1}
          pageSize={PAGE_SIZE}
        />
      </NotificationsPageShell>
    );
  }

  const where = { userId: dbUser.id };
  const total = await prisma.notification.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const skip = (safePage - 1) * PAGE_SIZE;

  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        read: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where: { ...where, read: false } }),
  ]);

  const items: NotificationRow[] = rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <NotificationsPageShell page={safePage}>
      <NotificationsList
        initialItems={items}
        initialTotal={total}
        initialUnread={unreadCount}
        page={safePage}
        pageSize={PAGE_SIZE}
      />
    </NotificationsPageShell>
  );
}

function NotificationsPageShell({
  children,
}: {
  children: React.ReactNode;
  page: number;
}) {
  return (
    <div className="space-y-8 max-w-4xl">
      <header className="space-y-3">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
          Notifications
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-2xl">
          Your alerts
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Watchlist risk changes, guardian updates, and other important events in one place.
        </p>
      </header>
      {children}
    </div>
  );
}
