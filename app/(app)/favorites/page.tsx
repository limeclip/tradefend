import { redirect } from 'next/navigation';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { FavoritesList } from '@/components/favorites/FavoritesList';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true, subscriptionPlan: true, subscriptionStatus: true },
  });

  const isPro =
    dbUser?.subscriptionStatus === 'active' &&
    (dbUser?.subscriptionPlan === 'pro_monthly' || dbUser?.subscriptionPlan === 'pro_yearly');

  const rows = dbUser?.id
    ? await prisma.favorite.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, tokenQuery: true, createdAt: true },
      })
    : [];

  const favorites = rows.map((r) => ({
    id: r.id,
    tokenQuery: r.tokenQuery,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
          Favorites
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-2xl">Saved tokens</h1>
        <p className="max-w-2xl text-muted-foreground">Quickly rerun analysis for tokens you care about.</p>
      </header>

      {!isPro ? (
        <div className="rounded-3xl border border-border dark:border-border/50 bg-card dark:bg-[#1c1c1c] px-6 py-16 text-center shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Favorites are for Pro users only.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Favorites are for Pro users only. Upgrade to start saving tokens.
          </p>
          <Link href="/pricing" className="mt-6 inline-flex">
            <Button className="rounded-2xl">View Pro plans</Button>
          </Link>
        </div>
      ) : null}

      <FavoritesList favorites={favorites} isPro={isPro} />
    </div>
  );
}

