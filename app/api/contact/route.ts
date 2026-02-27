import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { headers } from 'next/headers';
import { getSiteConfig } from '@/lib/settings';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// Zod validation for the contact form
const ContactSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    // Validates Nepali phone numbers (optional +977 prefix, followed by 10 digits starting with 9)
    phone: z.string().regex(/^(?:\+?977[- \s]?)?(9\d{9})$/, 'Must be a valid Nepali phone number (e.g. 9812345678)'),
    subject: z.enum(['Order Issue', 'Product Query', 'Collaboration', 'Other'], {
        errorMap: () => ({ message: 'Please select a valid subject' })
    }),
    message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message is too long')
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const headersList = await headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

        // 1. Rate Limiting: Limit 5 submissions per IP per hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentSubmissions = await prisma.contactMessage.count({
            where: {
                ipAddress: ip,
                createdAt: { gt: oneHourAgo }
            }
        });

        if (recentSubmissions >= 5) {
            return NextResponse.json(
                { error: 'You have reached the maximum number of submissions per hour. Please try again later.' },
                { status: 429 }
            );
        }

        // 2. Validate Input
        const data = ContactSchema.parse(body);

        // 3. Store in Database
        const newMessage = await prisma.contactMessage.create({
            data: {
                name: data.name,
                email: data.email || null,
                phone: data.phone,
                subject: data.subject,
                message: data.message,
                ipAddress: ip
            }
        });

        // 4. Notifications (Mocked for now since notification logic is usually handled by a worker/provider)
        const config = await getSiteConfig();
        if (config.emailNotificationsEnabled) {
            // Send an email to admin
            logger.info('Sending new contact message notification to admin', { messageId: newMessage.id });

            // If user provided email, send confirmation to user
            if (data.email) {
                logger.info('Sending confirmation email to customer', { email: data.email });
            }
        } else if (!data.email && config.smsNotificationsEnabled) {
            // Optional SMS confirmation
            logger.info('Sending SMS confirmation to customer', { phone: data.phone });
        }

        return NextResponse.json({ success: true, messageId: newMessage.id });

    } catch (error) {
        logger.error('Contact submission failed', error);

        if (error instanceof z.ZodError) {
            // Extract the first error message for clean UI display
            const firstError = error.errors[0]?.message || 'Invalid form data';
            return NextResponse.json({ error: firstError, details: error.errors }, { status: 400 });
        }

        return NextResponse.json({ error: 'Failed to submit message. Please try again.' }, { status: 500 });
    }
}
