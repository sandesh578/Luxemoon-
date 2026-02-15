'use client';

import { useState } from 'react';
import { updateOrderStatus } from './actions';
import { Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Define minimal interfaces needed for the table display
// This avoids importing heavy Prisma types into client components
interface AdminProduct {
  name: string;
}

interface AdminOrderItem {
  id: string;
  quantity: number;
  price: number;
  product: AdminProduct;
}

interface Order {
  id: string;
  customerName: string;
  phone: string;
  total: number;
  status: string;
  isInsideValley: boolean;
  items: AdminOrderItem[];
  updatedAt: Date;
  rejectionReason?: string | null;
}

export const AdminOrderTable = ({ orders }: { orders: Order[] }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const handleStatusChange = async (orderId: string, newStatus: string, phone: string, updatedAt: Date) => {
    let reason = undefined;
    
    if (newStatus === 'CANCELLED') {
      const input = window.prompt("Enter rejection/cancellation reason:");
      if (input === null) return; // Cancel clicked
      reason = input || "No reason provided";
    }

    setLoadingId(orderId);
    const result = await updateOrderStatus(orderId, newStatus, phone, updatedAt, reason);
    setLoadingId(null);
    
    if (!result.success) {
      alert(result.error);
      router.refresh(); 
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
                  {order.items.map((i) => (
                    <div key={i.id} className="text-xs text-stone-600">
                      <span className="font-bold">{i.quantity}x</span> {i.product.name}
                    </div>
                  ))}
                </div>
              </td>
              <td className="p-4 font-bold text-stone-900">NPR {order.total.toLocaleString()}</td>
              <td className="p-4">
                <div className="flex flex-col gap-2">
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
                  {order.status === 'CANCELLED' && order.rejectionReason && (
                    <div className="flex items-start gap-1 text-xs text-red-600 bg-red-50 p-1.5 rounded-lg max-w-[200px]">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{order.rejectionReason}</span>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
