import { prisma } from '@/lib/prisma';
import { AdminOrderTable } from './AdminOrderTable';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [orders, statusCounts, revenueStats] = await Promise.all([
    prisma.order.findMany({
      take: 25,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        customerName: true,
        phone: true,
        province: true,
        district: true,
        address: true,
        isInsideValley: true,
        total: true,
        status: true,
        rejectionReason: true,
        trackingNumber: true,
        courierName: true,
        paymentReceived: true,
        adminNotes: true,
        createdAt: true,
        updatedAt: true,
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
          orderBy: { sentAt: 'desc' as const },
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
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] } },
      _sum: { total: true },
    }),
  ]);

  const counts = {
    total: 0,
    pending: 0,
    active: 0,
    delivered: 0,
  };

  const revenue = revenueStats._sum.total || 0;

  for (const group of statusCounts) {
    counts.total += group._count.id;
    if (group.status === 'PENDING') counts.pending = group._count.id;
    if (group.status === 'CONFIRMED' || group.status === 'SHIPPED') counts.active += group._count.id;
    if (group.status === 'DELIVERED') counts.delivered = group._count.id;
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Orders" value={counts.total} color="bg-stone-100 text-stone-800" />
        <StatCard label="Pending" value={counts.pending} color="bg-yellow-50 text-yellow-800" />
        <StatCard label="Active" value={counts.active} color="bg-blue-50 text-blue-800" />
        <StatCard label="Delivered" value={counts.delivered} color="bg-green-50 text-green-800" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <StatCard label="Total Sales (Global)" value={`Rs. ${revenue.toLocaleString()}`} color="bg-stone-900 text-white border-none" />
        <StatCard label="Live Orders" value={counts.total} color="bg-white text-stone-800" />
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-serif font-bold text-stone-900">Order Management</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <AdminOrderTable orders={orders} />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className={`${color} rounded-xl p-4 border border-stone-200 shadow-sm`}>
      <div className="text-2xl md:text-3xl font-bold tracking-tight">{value}</div>
      <div className="text-xs font-semibold mt-1 opacity-80 uppercase tracking-widest">{label}</div>
    </div>
  );
}
