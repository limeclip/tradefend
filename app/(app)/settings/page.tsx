import { redirect } from 'next/navigation';
import { SettingsForm } from '@/components/settings/SettingsForm';
import { TelegramSettings } from '@/components/settings/TelegramSettings';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/prisma';
import { getMonthlyLimit } from '@/lib/subscription/limits';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: {
      email: true,
      fullName: true,
      avatarUrl: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      checksUsedThisMonth: true,
      subscriptionExpiresAt: true,
      telegramChatId: true,
    },
  });

  const email = dbUser?.email ?? user.email ?? `${user.id}@supabase.local`;
  const fullName = dbUser?.fullName ?? null;
  const plan = dbUser?.subscriptionPlan ?? 'free';
  const status = dbUser?.subscriptionStatus ?? 'inactive';
  const checksUsed = dbUser?.checksUsedThisMonth ?? 0;
  const monthlyLimit = getMonthlyLimit({ subscriptionPlan: plan });
  const isPro = status === 'active' && (plan === 'pro_monthly' || plan === 'pro_yearly');

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
          Settings
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-2xl px-2">Account</h1>
        <p className="max-w-2xl text-muted-foreground px-2">Update your profile details and preferences.</p>
      </header>
      <div className='flex flex-col gap-4'>

        <div className="tracking-tight px-2 text-muted-foreground">Profile</div>

        <SettingsForm
          email={email}
          fullName={fullName}
          avatarUrl={dbUser?.avatarUrl ?? null}
          subscription={{
            plan,
            status,
            checksUsed,
            monthlyLimit,
            expiresAt: dbUser?.subscriptionExpiresAt?.toISOString() ?? null,
            isPro,
          }}
        />

        <TelegramSettings initialChatId={dbUser?.telegramChatId ?? null} />
      </div>
    </div>
  );
}
