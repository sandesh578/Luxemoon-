import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin();
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        address: true,
        trackingNumber: true,
        courierName: true,
        adminNotes: true,
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: {
              select: { name: true },
            },
          },
        },
        notifications: {
          orderBy: { sentAt: 'desc' },
          take: 5,
          select: {
            id: true,
            type: true,
            status: true,
            errorMessage: true,
            sentAt: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch order details' }, { status: 500 });
  }
}
