import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { encrypt } from '@/lib/auth-edge';
import { validateServerEnv } from '@/lib/env';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

validateServerEnv();

const adminEmail = process.env.ADMIN_EMAIL;
const adminPass = process.env.ADMIN_PASSWORD;

if (!adminEmail || !adminPass) {
  throw new Error('Missing required environment variables: ADMIN_EMAIL, ADMIN_PASSWORD');
}

async function safeCountRecentFailedAttempts(ip: string) {
  try {
    return await prisma.loginAttempt.count({
      where: {
        ip,
        success: false,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    });
  } catch (error) {
    logger.error('Admin login rate-limit check failed', error);
    return 0;
  }
}

async function safeRecordLoginAttempt(ip: string, email: string, success: boolean) {
  try {
    await prisma.loginAttempt.create({
      data: { ip, email: email.substring(0, 50), success },
    });
  } catch (error) {
    logger.error('Admin login attempt log failed', error);
  }
}

async function safeClearFailedAttempts(ip: string) {
  try {
    await prisma.loginAttempt.deleteMany({
      where: { ip, success: false },
    });
  } catch (error) {
    logger.error('Admin login failed-attempt cleanup failed', error);
  }
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

    const recentFailedAttempts = await safeCountRecentFailedAttempts(ip);

    if (recentFailedAttempts >= 5) {
      logger.warn('Admin login rate limit exceeded', { ip });
      return NextResponse.json(
        { error: 'Too many failed login attempts. Please wait 1 minute.' },
        { status: 429 }
      );
    }

    const isValid = email === adminEmail && password === adminPass;

    if (!isValid) {
      await safeRecordLoginAttempt(ip, email, false);
      logger.warn('Invalid admin login attempt', { ip, email });
      return NextResponse.json(
        { error: 'Incorrect admin email or password.' },
        { status: 401 }
      );
    }

    await safeClearFailedAttempts(ip);
    await safeRecordLoginAttempt(ip, email, true);

    const token = await encrypt({ email, role: 'admin' });

    const response = NextResponse.json({ success: true });
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    logger.info('Admin logged in successfully', { ip });
    return response;
  } catch (error) {
    logger.error('Login error', error);
    return NextResponse.json(
      { error: 'Admin login is temporarily unavailable. Please try again shortly.' },
      { status: 500 }
    );
  }
}
