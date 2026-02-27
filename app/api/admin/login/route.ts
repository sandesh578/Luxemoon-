import { NextResponse } from 'next/server';
import { encrypt } from '@/lib/auth-edge';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { validateServerEnv } from '@/lib/env';

export const runtime = 'nodejs';

validateServerEnv();

const adminEmail = process.env.ADMIN_EMAIL;
const adminPass = process.env.ADMIN_PASSWORD;

if (!adminEmail || !adminPass) {
  throw new Error('Missing required environment variables: ADMIN_EMAIL, ADMIN_PASSWORD');
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

    // 1. Rate Limiting — count only FAILED attempts in the last minute
    const recentFailedAttempts = await prisma.loginAttempt.count({
      where: {
        ip,
        success: false,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) }
      }
    });

    if (recentFailedAttempts >= 5) {
      logger.warn('Admin login rate limit exceeded', { ip });
      return NextResponse.json(
        { error: 'Too many failed login attempts. Please wait 1 minute.' },
        { status: 429 }
      );
    }

    // 2. Credential verification
    const isValid = email === adminEmail && password === adminPass;

    if (!isValid) {
      // Log failed attempt
      await prisma.loginAttempt.create({
        data: { ip, email: email.substring(0, 50), success: false }
      });
      logger.warn('Invalid admin login attempt', { ip, email });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 3. Success — clear failed attempts for this IP, log success
    await prisma.loginAttempt.deleteMany({
      where: { ip, success: false }
    });
    await prisma.loginAttempt.create({
      data: { ip, email: email.substring(0, 50), success: true }
    });

    // 4. Sign JWT and set cookie on the RESPONSE object
    const token = await encrypt({ email, role: 'admin' });

    const response = NextResponse.json({ success: true });
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    logger.info('Admin logged in successfully', { ip });
    return response;

  } catch (error) {
    logger.error('Login error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
