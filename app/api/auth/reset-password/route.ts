import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { decrypt } from '@/lib/auth-edge';

const MIN_PASSWORD_LENGTH = 8;

type ResetPayload = {
  type?: unknown;
  userId?: unknown;
  email?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!token || !password) {
      return NextResponse.json({ error: 'Reset token and new password are required.' }, { status: 400 });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const payload = (await decrypt(token)) as ResetPayload;
    if (payload.type !== 'password_reset' || typeof payload.userId !== 'string' || typeof payload.email !== 'string') {
      return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, isActive: true },
    });

    if (!user || !user.isActive || user.email.toLowerCase() !== payload.email.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 });
    }

    const nextHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: nextHash },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 });
  }
}
