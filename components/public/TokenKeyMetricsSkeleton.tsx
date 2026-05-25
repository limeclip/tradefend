import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TokenKeyMetricsSkeleton() {
  return (
    <section className="space-y-3" aria-hidden>
      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-2xl border-border py-0 shadow-sm">
            <CardContent className="space-y-2 px-4 py-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
