import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { headers } from 'next/headers';
import { ReviewSchema } from '@/lib/review-validation';

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

        const body = await req.json();
        const data = ReviewSchema.parse(body);

        // Verify product exists
        const product = await prisma.product.findUnique({
            where: { id: data.productId },
            select: { id: true, isActive: true, isArchived: true, isDraft: true },
        });

        if (!product || !product.isActive || product.isArchived || product.isDraft) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const review = await prisma.review.create({
            data: {
                userName: data.userName,
                address: data.address,
                rating: data.rating,
                comment: data.comment,
                productId: data.productId,
                images: data.images,
                video: data.video,
                approved: false, // Reviews should be approved by admin
                ipAddress: ip,
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
        return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
    }
}
