import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { getCloudinary } from '@/lib/cloudinary';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        await verifyAdmin();

        const { publicId } = await req.json();

        if (!publicId || typeof publicId !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid public_id' }, { status: 400 });
        }

        const cloudinary = getCloudinary();
        const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });

        if (result.result === 'ok' || result.result === 'not_found') {
            return NextResponse.json({ success: true, result });
        } else {
            logger.error('Cloudinary delete error', result);
            return NextResponse.json({ error: 'Failed to delete from Cloudinary' }, { status: 500 });
        }

    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error instanceof Error && error.message.includes('Missing Cloudinary environment variables')) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        logger.error('Delete request failed', error);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
