import { prisma } from '@/lib/prisma';
import { AdminOrderTable } from './AdminOrderTable';
import { LogOut } from 'lucide-react';
import Link from 'next/link';

// Ensure this page is not cached statically so admins see real-time data
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } } }
  });

  return (
    <div className="min-h-screen bg-stone-100 flex">
      <aside className="w-64 bg-stone-900 text-stone-400 p-6 flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="font-serif text-white text-xl font-bold mb-10">LUXE MOON</div>
        <nav className="space-y-2 flex-1">
          <div className="w-full text-left p-3 rounded-lg flex items-center gap-3 bg-amber-600 text-white font-bold cursor-default">
            Orders
          </div>
          {/* Future: Add Products tab here */}
        </nav>
        <Link href="/" className="flex items-center gap-2 text-stone-500 hover:text-white transition-colors">
          <LogOut className="w-4 h-4" /> Exit
        </Link>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
           <h1 className="text-3xl font-serif font-bold text-stone-900">Order Management</h1>
           <div className="text-sm text-stone-500">Total Orders: {orders.length}</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <AdminOrderTable orders={orders} />
        </div>
      </main>
    </div>
  );
}