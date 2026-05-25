'use client';

import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '../ui/separator';

type ActivityPoint = {
  date: string;
  count: number;
};

type ActivityResponse = {
  activity?: ActivityPoint[];
  error?: string;
};

type DayCell = {
  date: Date;
  isoDate: string;
  count: number;
  inRange: boolean;
};

type MonthLabel = {
  month: string;
  weekIndex: number;
};

type ActivityStats = {
  mostActiveMonth: string;
  mostActiveDay: string;
  longestStreak: string;
  currentStreak: string;
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatTooltipDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count >= 10) return 4;
  if (count >= 6) return 3;
  if (count >= 3) return 2;
  if (count >= 1) return 1;
  return 0;
}

function getLevelClass(level: 0 | 1 | 2 | 3 | 4): string {
  return `bg-activity-${level}`;
}

function buildWeeks(activityMap: Map<string, number>): DayCell[][] {
  const today = startOfDay(new Date());
  const rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - 364);

  const alignedStart = new Date(rangeStart);
  alignedStart.setDate(alignedStart.getDate() - alignedStart.getDay());

  const alignedEnd = new Date(today);
  alignedEnd.setDate(alignedEnd.getDate() + (6 - alignedEnd.getDay()));

  const days: DayCell[] = [];
  const cursor = new Date(alignedStart);

  while (cursor <= alignedEnd) {
    const isoDate = toIsoDate(cursor);
    const inRange = cursor >= rangeStart && cursor <= today;

    days.push({
      date: new Date(cursor),
      isoDate,
      count: inRange ? activityMap.get(isoDate) ?? 0 : 0,
      inRange,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  const weeks: DayCell[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return weeks;
}

function buildMonthLabels(weeks: DayCell[][]): MonthLabel[] {
  const labels: MonthLabel[] = [];
  let lastMonth = '';

  for (let weekIndex = 0; weekIndex < weeks.length; weekIndex += 1) {
    const week = weeks[weekIndex];
    const firstActiveDay = week.find((day) => day.inRange);
    if (!firstActiveDay) continue;

    const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(firstActiveDay.date);
    if (month !== lastMonth) {
      labels.push({ month, weekIndex });
      lastMonth = month;
    }
  }

  return labels;
}

function buildActivityStats(weeks: DayCell[][]): ActivityStats {
  const days = weeks.flat().filter((day) => day.inRange);

  const monthTotals = new Map<string, number>();
  let bestDay: DayCell | null = null;

  for (const day of days) {
    const monthKey = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}`;
    monthTotals.set(monthKey, (monthTotals.get(monthKey) ?? 0) + day.count);

    if (!bestDay || day.count > bestDay.count) {
      bestDay = day;
    }
  }

  let bestMonthKey: string | null = null;
  let bestMonthCount = -1;
  for (const [monthKey, total] of monthTotals.entries()) {
    if (total > bestMonthCount) {
      bestMonthCount = total;
      bestMonthKey = monthKey;
    }
  }

  const mostActiveMonth =
    bestMonthKey && bestMonthCount > 0
      ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(`${bestMonthKey}-01T00:00:00`))
      : '-';

  const mostActiveDay =
    bestDay && bestDay.count > 0 ? formatTooltipDate(bestDay.date) : '-';

  let longest = 0;
  let running = 0;

  for (const day of days) {
    if (day.count > 0) {
      running += 1;
      if (running > longest) {
        longest = running;
      }
    } else {
      running = 0;
    }
  }

  let current = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (days[i].count > 0) {
      current += 1;
    } else {
      break;
    }
  }

  return {
    mostActiveMonth,
    mostActiveDay,
    longestStreak: `${longest}d`,
    currentStreak: `${current}d`,
  };
}

export function ActivityCalendar() {
  const [activityMap, setActivityMap] = React.useState<Map<string, number>>(new Map());
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isCancelled = false;

    async function loadActivity() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/activity', { method: 'GET', cache: 'no-store' });
        const json = (await res.json().catch(() => null)) as ActivityResponse | null;

        if (!res.ok || !json?.activity || !Array.isArray(json.activity)) {
          throw new Error(json?.error ?? 'Failed to load activity');
        }

        const nextMap = new Map<string, number>();
        for (const item of json.activity) {
          if (typeof item.date !== 'string' || typeof item.count !== 'number') {
            continue;
          }
          nextMap.set(item.date, item.count);
        }

        if (!isCancelled) {
          setActivityMap(nextMap);
        }
      } catch (e) {
        if (!isCancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load activity');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadActivity();

    return () => {
      isCancelled = true;
    };
  }, []);

  const weeks = React.useMemo(() => buildWeeks(activityMap), [activityMap]);
  const monthLabels = React.useMemo(() => buildMonthLabels(weeks), [weeks]);
  const stats = React.useMemo(() => buildActivityStats(weeks), [weeks]);

  return (
    <Card className="rounded-2xl ring-foreground/10 dark:ring-border/50 shadow-sm bg-background dark:bg-[#1c1c1c]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg tracking-tight">Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="md:overflow-x-hidden overflow-x-auto">
          <TooltipProvider delay={120}>
            <div className="inline-flex items-start gap-3 min-w-max">
              <div className="w-8" />

              <div
                className="grid grid-flow-col gap-1 mb-1"
                style={{ gridTemplateColumns: `repeat(${weeks.length}, var(--activity-cell-size))` }}
              >
                {monthLabels.map((label) => (
                  <span
                    key={`${label.month}-${label.weekIndex}`}
                    className="md:text-[11px] text-[10px] text-muted-foreground"
                    style={{ gridColumnStart: label.weekIndex + 1 }}
                  >
                    {label.month}
                  </span>
                ))}
              </div>
            </div>

            <div className="inline-flex items-start gap-3 min-w-max">
              <div className="grid grid-rows-7 gap-0.5 ">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label} className=" md:text-[11px] text-[10px] text-muted-foreground">
                    {label}
                  </span>
                ))}
              </div>

              <div className="grid grid-flow-col grid-rows-7 gap-1.5">
                {weeks.flatMap((week, weekIndex) =>
                  week.map((day, dayIndex) => {
                    const level = getLevel(day.count);
                    const tooltipText = `${formatTooltipDate(day.date)}: ${day.count} check${day.count === 1 ? '' : 's'}`;
                    return (
                      <Tooltip key={`${weekIndex}-${day.isoDate}`}>
                        <TooltipTrigger
                          className={`h-2.5 w-2.5 rounded-[3px] sm:h-3 sm:w-3 ${getLevelClass(level)} ${loading ? 'opacity-70' : ''}`}
                          aria-label={`${WEEKDAY_LABELS[dayIndex]}, ${tooltipText}`}
                        />
                        <TooltipContent side="top">{tooltipText}</TooltipContent>
                      </Tooltip>
                    );
                  }),
                )}
              </div>
            </div>
          </TooltipProvider>
        </div>
<Separator/>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-xs">Most Active Month</p>
            <p className="font-medium text-foreground">{stats.mostActiveMonth}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Most Active Day</p>
            <p className="font-medium text-foreground">{stats.mostActiveDay}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Longest Streak</p>
            <p className="font-medium text-foreground">{stats.longestStreak}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Current Streak</p>
            <p className="font-medium text-foreground">{stats.currentStreak}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Fewer</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span key={level} className={`h-2.5 w-2.5 rounded-[3px] sm:h-3 sm:w-3 ${getLevelClass(level as 0 | 1 | 2 | 3 | 4)}`} />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
