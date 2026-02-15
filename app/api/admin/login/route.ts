import { NextResponse } from 'next/server';
import { encrypt } from '@/lib/auth';
import { cookies, headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

    // 1. Rate Limiting
    const recentAttempts = await prisma.loginAttempt.count({
      where: {
        ip,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) } // 1 minute
      }
    });

    if (recentAttempts >= 5) {
      logger.warn('Admin login rate limit exceeded', { ip });
      return NextResponse.json({ error: 'Too many login attempts.' }, { status: 429 });
    }

    // Use Environment Variables for credentials, fallback to defaults only for setup
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@luxemoon.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin';

    const isValid = email === adminEmail && password === adminPass;

    // Log attempt
    await prisma.loginAttempt.create({
      data: { ip, email: email.substring(0, 50), success: isValid }
    });

    if (!isValid) {
      logger.warn('Invalid admin login attempt', { ip, email });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await encrypt({ email });
    const cookieStore = await cookies();
    
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    logger.info('Admin logged in', { ip });
    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Login error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}