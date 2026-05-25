import { redirect } from 'next/navigation';

import { GuardianDashboard } from '@/components/guardian/GuardianDashboard';
import { SectionInfoButton } from '@/components/help/SectionInfoButton';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { GUARDIAN_CONFIG } from '@/lib/guardian/config';

export const dynamic = 'force-dynamic';

export default async function GuardianPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
          {GUARDIAN_CONFIG.navLabel}
        </Badge>
        <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-2xl">
            {GUARDIAN_CONFIG.displayName}
          </h1>
          <SectionInfoButton section="guardian" className="mt-1" />
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Your AI trade companion — explain risk, review positions, and get clear guidance before you trade.
        </p>
      </header>

      {/* <GuardianEmptyState status={status} /> */}

      <section className="mt-2">
        <GuardianDashboard />
      </section>
    </div>
  );
}
