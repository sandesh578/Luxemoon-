import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getUserSession();
    if (!session) return NextResponse.json({ authenticated: false });
    return NextResponse.json({ authenticated: true, user: session });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
