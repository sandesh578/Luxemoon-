import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Users, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ search?: string; page?: string }> }) {
  const params = await searchParams;
  const search = params.search || '';
  const rawPage = Number.parseInt(params.page || '1', 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize = 20;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        _count: { select: { orders: true } },
        orders: {
          select: { total: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const enrichedUsers = users.map(user => {
    const totalSpend = user.orders.reduce((sum, o) => sum + Number(o.total), 0);
    const lastOrder = user.orders[0]?.createdAt || null;
    return { ...user, totalSpend, lastOrder, orderCount: user._count.orders };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-stone-700" />
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-900">Users</h1>
            <p className="text-sm text-stone-500">{total} registered users</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        {/* Search */}
        <form className="p-4 border-b border-stone-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
            />
          </div>
        </form>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-stone-50 border-b">
              <tr>
                <th className="p-4 text-left font-bold text-stone-700">Name</th>
                <th className="p-4 text-left font-bold text-stone-700">Email</th>
                <th className="p-4 text-left font-bold text-stone-700">Phone</th>
                <th className="p-4 text-left font-bold text-stone-700">Orders</th>
                <th className="p-4 text-left font-bold text-stone-700">Total Spend</th>
                <th className="p-4 text-left font-bold text-stone-700">Last Order</th>
                <th className="p-4 text-left font-bold text-stone-700">Joined</th>
                <th className="p-4 text-left font-bold text-stone-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {enrichedUsers.map(user => (
                <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-4 font-medium text-stone-900">{user.name}</td>
                  <td className="p-4 text-stone-600">{user.email}</td>
                  <td className="p-4 text-stone-600 font-mono text-xs">{user.phone || '—'}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 bg-stone-100 text-stone-700 rounded-full text-xs font-bold">
                      {user.orderCount}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-stone-900">${user.totalSpend.toFixed(2)}</td>
                  <td className="p-4 text-stone-400 text-xs">
                    {user.lastOrder ? new Date(user.lastOrder).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-4 text-stone-400 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <Link href={`/admin/users/${user.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900">
                      <Eye className="w-3 h-3" /> View
                    </Link>
                  </td>
                </tr>
              ))}
              {enrichedUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <span className="text-xs text-stone-500">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              {page > 1 && (
                <Link href={`/admin/users?page=${page - 1}&search=${search}`} className="p-1.5 bg-stone-100 rounded-lg hover:bg-stone-200 transition">
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/users?page=${page + 1}&search=${search}`} className="p-1.5 bg-stone-100 rounded-lg hover:bg-stone-200 transition">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


