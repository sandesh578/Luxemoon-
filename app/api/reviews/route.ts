import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { headers } from 'next/headers';
import { ReviewSchema } from '@/lib/review-validation';
import { getUserSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getClientIp(headersList: Headers): string {
    const forwardedFor = headersList.get('x-forwarded-for');
    if (forwardedFor) return forwardedFor.split(',')[0].trim();
    const realIp = headersList.get('x-real-ip');
    return realIp?.trim() || 'unknown';
}

export async function POST(req: Request) {
    try {
        const session = await getUserSession();
        if (!session) {
            return NextResponse.json({ error: 'You must be logged in to write a review' }, { status: 401 });
        }

        const body = await req.json();
        const data = ReviewSchema.parse(body);
        const headersList = await headers();
        const ip = getClientIp(headersList);

        // Rate limit: 3 reviews per IP per hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentReviewsCount = await prisma.review.count({
            where: {
                ipAddress: ip,
                createdAt: { gt: oneHourAgo },
            },
        });

        if (recentReviewsCount >= 3) {
            return NextResponse.json(
                { error: 'Too many reviews. Please try again later.' },
                { status: 429 }
            );
        }

        // Verify product exists
        const product = await prisma.product.findUnique({
            where: { id: data.productId },
            select: { id: true, isActive: true, isArchived: true, isDraft: true },
        });

        if (!product || !product.isActive || product.isArchived || product.isDraft) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Check for verified purchase (Logic kept but DB write disabled until migration)
        const deliveredOrder = await prisma.order.findFirst({
            where: {
                userId: session.userId,
                status: 'DELIVERED',
                items: {
                    some: {
                        productId: data.productId,
                    },
                },
            },
        });

        // const isVerified = !!deliveredOrder;

        const review = await prisma.review.create({
            data: {
                userName: data.userName || session.name,
                address: data.address,
                rating: data.rating,
                comment: data.comment,
                productId: data.productId,
                images: data.images,
                video: data.video,
                approved: false, // Reviews should be approved by admin
                ipAddress: ip,
                // TEMPORARY: Disabled due to missing DB columns
                // isVerified: isVerified,
                // verifiedPurchase: isVerified,
            },
        });

        return NextResponse.json({ success: true, review: { id: review.id } });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid data', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Review submission error:', error);
        return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
    }
}
