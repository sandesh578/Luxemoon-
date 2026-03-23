import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const rawPage = Number.parseInt(searchParams.get('page') || '1', 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const pageSize = 10;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: session.userId },
        include: {
          items: {
            include: {
              product: {
                select: { name: true, images: true, slug: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where: { userId: session.userId } }),
    ]);

    return NextResponse.json({
      orders: orders.map(o => ({
        ...o,
        total: Number(o.total),
        couponDiscount: o.couponDiscount ? Number(o.couponDiscount) : null,
        items: o.items.map(item => ({
          ...item,
          price: Number(item.price),
        })),
      })),
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      currentPage: page,
      total,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
