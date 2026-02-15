import { prisma } from '@/lib/prisma';
import { AdminOrderTable } from './AdminOrderTable';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } } }
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
         <h1 className="text-3xl font-serif font-bold text-stone-900">Order Management</h1>
         <div className="text-sm font-bold text-amber-700 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
           Total Orders: {orders.length}
         </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <AdminOrderTable orders={orders} />
      </div>
    </div>
  );
}
