import { prisma } from '@/lib/prisma';
import { Trash, Ban } from 'lucide-react';
import { addToBlacklist, removeFromBlacklist } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminCustomers() {
  const blocked = await prisma.blockedCustomer.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-stone-900 mb-8">Blacklisted Numbers</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 mb-8">
        <h2 className="font-bold mb-4">Block a Number</h2>
        <form action={async (formData) => {
          'use server';
          const phone = formData.get('phone') as string;
          const reason = formData.get('reason') as string;
          await addToBlacklist(phone, reason);
        }} className="flex gap-4">
          <input name="phone" placeholder="Phone Number" className="p-2 border rounded-lg flex-1" required />
          <input name="reason" placeholder="Reason" className="p-2 border rounded-lg flex-1" required />
          <button className="bg-red-600 text-white px-4 rounded-lg font-bold flex items-center gap-2">
            <Ban className="w-4 h-4" /> Block
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="p-4">Phone</th>
              <th className="p-4">Reason</th>
              <th className="p-4">Date Blocked</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {blocked.map(b => (
              <tr key={b.id}>
                <td className="p-4 font-mono font-bold">{b.phone}</td>
                <td className="p-4 text-red-600">{b.reason}</td>
                <td className="p-4 text-stone-500">{b.createdAt.toLocaleDateString()}</td>
                <td className="p-4">
                  <form action={async () => {
                    'use server';
                    await removeFromBlacklist(b.id);
                  }}>
                    <button className="text-stone-500 hover:text-stone-800">Unblock</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
