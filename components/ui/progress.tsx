'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

type ProgressProps = React.ComponentProps<'div'> & {
  value?: number;
  indicatorClassName?: string;
};

function Progress({ className, value = 0, indicatorClassName, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <section
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <span
        className={cn('absolute inset-y-0 left-0 rounded-full bg-foreground transition-[width] duration-500', indicatorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </section>
  );
}

export { Progress };
