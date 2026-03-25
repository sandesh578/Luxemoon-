import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { encryptWithExpiration } from '@/lib/auth-edge';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').toLowerCase().trim();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, isActive: true },
    });

    // Always return success response to avoid account enumeration.
    if (!user || !user.isActive) {
      return NextResponse.json({ success: true });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ success: true });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.luxemoonbeauty.com';
    const resetToken = await encryptWithExpiration(
      { type: 'password_reset', userId: user.id, email: user.email },
      '15m'
    );
    const resetUrl = `${siteUrl}/login?reset=${encodeURIComponent(resetToken)}`;

    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: 'Luxe Moon <no-reply@luxemoonbeauty.com>',
      to: [user.email],
      subject: 'Reset your Luxe Moon password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
          <h2 style="margin:0 0 12px;color:#1c1917;">Password reset request</h2>
          <p style="margin:0 0 12px;color:#44403c;">Hi ${user.name},</p>
          <p style="margin:0 0 18px;color:#44403c;">We received a request to reset your password. Use the button below to continue.</p>
          <p style="margin:0 0 20px;">
            <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#1c1917;color:#fff;text-decoration:none;font-weight:600;">Reset Password</a>
          </p>
          <p style="margin:0;color:#78716c;font-size:13px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: true });
  }
}
