import { prisma } from '@/lib/prisma';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { addToBlacklist, removeFromBlacklist } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ search?: string; page?: string }> }) {
  const params = await searchParams;
  const search = params.search || '';
  const page = parseInt(params.page || '1');
  const pageSize = 20;

  const where: any = {};
  if (search) {
    where.OR = [
      { phone: { contains: search } },
      { reason: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [blacklisted, total] = await Promise.all([
    prisma.blockedCustomer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.blockedCustomer.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-stone-900">Blocked Customers</h1>
      </div>

      {/* Add New */}
      <form action={async (formData) => {
        'use server';
        const phone = formData.get('phone') as string;
        const reason = formData.get('reason') as string;
        if (phone && reason) await addToBlacklist(phone, reason);
      }} className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Block a Customer</h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input name="phone" required placeholder="Phone number" className="flex-1 p-2 border rounded-lg text-sm" />
          <input name="reason" required placeholder="Reason for blocking" className="flex-1 p-2 border rounded-lg text-sm" />
          <button className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700">Block</button>
        </div>
      </form>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <form className="p-4 border-b border-stone-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input name="search" defaultValue={search} placeholder="Search by phone or reason..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-lg" />
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-stone-50 border-b">
              <tr>
                <th className="p-4 text-left font-bold text-stone-700">Phone</th>
                <th className="p-4 text-left font-bold text-stone-700">Reason</th>
                <th className="p-4 text-left font-bold text-stone-700">Blocked On</th>
                <th className="p-4 text-left font-bold text-stone-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {blacklisted.map(b => (
                <tr key={b.id} className="hover:bg-stone-50">
                  <td className="p-4 font-mono">{b.phone}</td>
                  <td className="p-4 text-stone-600">{b.reason}</td>
                  <td className="p-4 text-stone-400 text-xs">{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <form action={async () => {
                      'use server';
                      await removeFromBlacklist(b.id);
                    }}>
                      <button className="text-xs text-red-600 font-bold hover:underline">Unblock</button>
                    </form>
                  </td>
                </tr>
              ))}
              {blacklisted.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-stone-400">No blocked customers</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <span className="text-xs text-stone-500">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              {page > 1 && <a href={`/admin/customers?page=${page - 1}&search=${search}`} className="p-1.5 bg-stone-100 rounded-lg"><ChevronLeft className="w-4 h-4" /></a>}
              {page < totalPages && <a href={`/admin/customers?page=${page + 1}&search=${search}`} className="p-1.5 bg-stone-100 rounded-lg"><ChevronRight className="w-4 h-4" /></a>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
