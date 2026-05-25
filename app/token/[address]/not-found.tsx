import Link from 'next/link';
import { ShieldQuestion } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function TokenNotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <ShieldQuestion className="size-12 text-muted-foreground" strokeWidth={1.25} />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Token not found</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          We could not find market data for this address. Check the address or try another chain.
        </p>
      </div>
      <Link href="/" className={cn(buttonVariants({ variant: 'outline' }), 'h-10 rounded-xl px-6')}>
        Back to home
      </Link>
    </div>
  );
}
