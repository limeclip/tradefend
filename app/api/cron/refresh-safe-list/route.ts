import { NextResponse } from 'next/server';

import { refreshSafeList } from '@/lib/safe-list/refresh';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function verifyCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET_TOKEN?.trim();
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await refreshSafeList();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: Request) {
  return POST(request);
}

