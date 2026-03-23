import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, MapPin, Package, FileText } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function saveAdminNote(formData: FormData) {
  'use server';
  const userId = formData.get('userId') as string;
  const note = formData.get('adminNote') as string;
  await prisma.user.update({
    where: { id: userId },
    data: { adminNote: note || null },
  });
  revalidatePath(`/admin/users/${userId}`);
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] },
      orders: {
        include: {
          items: {
            include: {
              product: { select: { name: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!user) notFound();

  const totalSpend = user.orders.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div>
      {/* Back + Header */}
      <div className="mb-8">
        <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-stone-200 flex items-center justify-center">
            <User className="w-7 h-7 text-stone-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">{user.name}</h1>
            <p className="text-sm text-stone-500">{user.email} {user.phone && `Â· ${user.phone}`}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-xs text-stone-500 font-medium">Total Orders</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{user.orders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-xs text-stone-500 font-medium">Total Spend</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">${totalSpend.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-xs text-stone-500 font-medium">Addresses</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{user.addresses.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-xs text-stone-500 font-medium">Joined</p>
          <p className="text-lg font-bold text-stone-900 mt-1">{new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin Notes */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-stone-900 mb-4">
              <FileText className="w-4 h-4" /> Admin Notes
            </h2>
            <form action={saveAdminNote}>
              <input type="hidden" name="userId" value={user.id} />
              <textarea
                name="adminNote"
                defaultValue={user.adminNote || ''}
                rows={4}
                placeholder="Internal notes about this customer..."
                className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:border-stone-900 resize-none"
              />
              <button
                type="submit"
                className="mt-3 w-full py-2 bg-stone-900 text-white text-sm font-semibold rounded-lg hover:bg-stone-800 transition"
              >
                Save Note
              </button>
            </form>
          </div>

          {/* Addresses */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 mt-6">
            <h2 className="flex items-center gap-2 text-sm font-bold text-stone-900 mb-4">
              <MapPin className="w-4 h-4" /> Addresses ({user.addresses.length})
            </h2>
            {user.addresses.length === 0 ? (
              <p className="text-sm text-stone-400">No saved addresses</p>
            ) : (
              <div className="space-y-3">
                {user.addresses.map(addr => (
                  <div key={addr.id} className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-semibold text-stone-900">{addr.fullName}</p>
                      {addr.isDefault && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Default</span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-1">{addr.phone}</p>
                    <p className="text-xs text-stone-600 mt-1">{addr.address}, {addr.city}, {addr.district}, {addr.province}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Orders */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <h2 className="flex items-center gap-2 text-sm font-bold text-stone-900 p-5 border-b border-stone-200">
              <Package className="w-4 h-4" /> Recent Orders ({user.orders.length})
            </h2>
            {user.orders.length === 0 ? (
              <p className="p-8 text-center text-sm text-stone-400">No orders yet</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {user.orders.map(order => (
                  <div key={order.id} className="p-4 hover:bg-stone-50 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-stone-500">#{order.id.slice(-8).toUpperCase()}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${STATUS_COLORS[order.status] || 'bg-stone-100 text-stone-600'}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-stone-900 text-sm">${Number(order.total).toFixed(2)}</span>
                        <p className="text-[10px] text-stone-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map(item => (
                        <span key={item.id} className="text-xs text-stone-600 bg-stone-100 px-2 py-1 rounded-lg">
                          {item.product.name} × {item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


