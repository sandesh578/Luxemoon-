import { NextResponse } from 'next/server';
import { getSiteConfig } from '@/lib/settings-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const config = await getSiteConfig();
  return NextResponse.json(config);
}
