'use client';

import { useState } from 'react';
import { updateOrderStatus } from './actions';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Order {
  id: string;
  customerName: string;
  phone: string;
  total: number;
  status: string;
  isInsideValley: boolean;
  items: any[];
  updatedAt: Date;
}

export const AdminOrderTable = ({ orders }: { orders: Order[] }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const handleStatusChange = async (orderId: string, newStatus: string, phone: string, updatedAt: Date) => {
    setLoadingId(orderId);
    const result = await updateOrderStatus(orderId, newStatus, phone, updatedAt);
    setLoadingId(null);
    
    if (!result.success) {
      alert(result.error);
      router.refresh(); // Refresh data on error/collision
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-stone-50 border-b border-stone-200">
          <tr>
            <th className="p-4 font-bold text-stone-700">Order ID</th>
            <th className="p-4 font-bold text-stone-700">Customer</th>
            <th className="p-4 font-bold text-stone-700">Items</th>
            <th className="p-4 font-bold text-stone-700">Total</th>
            <th className="p-4 font-bold text-stone-700">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {orders.map(order => (
            <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
              <td className="p-4 font-mono text-stone-500 text-xs">{order.id.slice(-8)}</td>
              <td className="p-4">
                <div className="font-bold text-stone-900">{order.customerName}</div>
                <div className="text-xs text-stone-500">{order.phone}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mt-1">
                  {order.isInsideValley ? 'Inside Valley' : 'Outside Valley'}
                </div>
              </td>
              <td className="p-4">
                <div className="space-y-1">
                  {order.items.map((i: any) => (
                    <div key={i.id} className="text-xs text-stone-600">
                      <span className="font-bold">{i.quantity}x</span> {i.product.name}
                    </div>
                  ))}
                </div>
              </td>
              <td className="p-4 font-bold text-stone-900">NPR {order.total.toLocaleString()}</td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <select 
                    className={`text-xs font-bold rounded-full px-3 py-1 border-none focus:ring-2 focus:ring-amber-500 cursor-pointer appearance-none ${statusColors[order.status] || 'bg-gray-100'}`}
                    value={order.status}
                    disabled={loadingId === order.id}
                    onChange={(e) => handleStatusChange(order.id, e.target.value, order.phone, order.updatedAt)}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                  {loadingId === order.id && <Loader2 className="w-4 h-4 animate-spin text-stone-400" />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};