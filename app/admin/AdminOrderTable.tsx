'use client';

import { useState, useMemo } from 'react';
import { updateOrderStatus, togglePaymentReceived, updateAdminNotes, resendNotification } from './actions';
import { Loader2, AlertCircle, Search, ChevronLeft, ChevronRight, Truck, Package, MessageSquare, Mail, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import { STATUS_COLORS, STATUS_LABELS, ORDER_STATUSES } from '@/lib/constants';

interface AdminProduct { name: string; }
interface AdminOrderItem { id: string; quantity: number; price: number; product: AdminProduct; }
interface Notification {
  id: string;
  type: string;
  status: string;
  errorMessage: string | null;
  sentAt: Date;
}
interface Order {
  id: string;
  customerName: string;
  phone: string;
  total: number;
  status: string;
  isInsideValley: boolean;
  items: AdminOrderItem[];
  notifications: Notification[];
  updatedAt: Date;
  rejectionReason?: string | null;
  trackingNumber?: string | null;
  courierName?: string | null;
  province: string;
  district: string;
  address: string;
  paymentReceived: boolean;
  adminNotes: string | null;
  createdAt: Date;
}

const PAGE_SIZE = 20;

export const AdminOrderTable = ({ orders }: { orders: Order[] }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ orderId: string; status: string; phone: string; updatedAt: Date } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [trackingInput, setTrackingInput] = useState<Record<string, { tracking: string; courier: string }>>({});
  const router = useRouter();

  const filtered = useMemo(() => {
    let result = orders;
    if (statusFilter !== 'ALL') {
      result = result.filter(o => o.status === statusFilter);
    }
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(o => new Date(o.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(o => new Date(o.createdAt) <= end);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.customerName.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleStatusChange = async (orderId: string, newStatus: string, phone: string, updatedAt: Date) => {
    if (newStatus === 'CANCELLED') {
      setConfirmAction({ orderId, status: newStatus, phone, updatedAt });
      return;
    }
    await executeStatusChange(orderId, newStatus, phone, updatedAt);
  };

  const executeStatusChange = async (orderId: string, newStatus: string, phone: string, updatedAt: Date, reason?: string) => {
    setLoadingId(orderId);
    const tracking = trackingInput[orderId];
    const result = await updateOrderStatus(
      orderId, newStatus, phone, updatedAt, reason,
      tracking?.tracking, tracking?.courier
    );
    setLoadingId(null);
    if (result.success) {
      toast.success(`Order ${STATUS_LABELS[newStatus] || newStatus}`);
    } else {
      toast.error(result.error || 'Failed to update');
      router.refresh();
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="p-4 border-b border-stone-200 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setStatusFilter('ALL'); setPage(1); }}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${statusFilter === 'ALL' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
            All ({orders.length})
          </button>
          {ORDER_STATUSES.map(s => {
            const count = orders.filter(o => o.status === s).length;
            if (count === 0) return null;
            return (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${statusFilter === s ? 'bg-stone-900 text-white' : STATUS_COLORS[s]}`}>
                {STATUS_LABELS[s]} ({count})
              </button>
            );
          })}
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPage(1); }}
              className="p-2 text-xs border border-stone-200 rounded-lg outline-none focus:border-amber-500"
              title="Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setPage(1); }}
              className="p-2 text-xs border border-stone-200 rounded-lg outline-none focus:border-amber-500"
              title="End Date"
            />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              placeholder="Search by name, phone, or order ID..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-lg focus:border-amber-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="p-4 font-bold text-stone-700">Order</th>
              <th className="p-4 font-bold text-stone-700">Customer</th>
              <th className="p-4 font-bold text-stone-700">Items</th>
              <th className="p-4 font-bold text-stone-700">Total</th>
              <th className="p-4 font-bold text-stone-700">Status</th>
              <th className="p-4 font-bold text-stone-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {paginated.map(order => (
              <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="p-4">
                  <div className="font-mono text-xs text-stone-500">{order.id.slice(-8)}</div>
                  <div className="text-[10px] text-stone-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-stone-900">{order.customerName}</div>
                  <div className="text-xs text-stone-500">{order.phone}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mt-1">
                    {order.isInsideValley ? 'Inside Valley' : 'Outside Valley'}
                  </div>
                </td>
                <td className="p-4">
                  <div className="space-y-1">
                    {order.items.slice(0, 3).map((i) => (
                      <div key={i.id} className="text-xs text-stone-600">
                        <span className="font-bold">{i.quantity}x</span> {i.product.name}
                      </div>
                    ))}
                    {order.items.length > 3 && <div className="text-xs text-stone-400">+{order.items.length - 3} more</div>}
                  </div>
                </td>
                <td className="p-4 font-bold text-stone-900">NPR {order.total.toLocaleString()}</td>
                <td className="p-4">
                  <select
                    className={`text-xs font-bold rounded-full px-3 py-1 border-none focus:ring-2 focus:ring-amber-500 cursor-pointer ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}
                    value={order.status}
                    disabled={loadingId === order.id}
                    onChange={(e) => handleStatusChange(order.id, e.target.value, order.phone, order.updatedAt)}
                  >
                    {ORDER_STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  {loadingId === order.id && <Loader2 className="w-4 h-4 animate-spin text-stone-400 mt-1" />}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    className="text-xs text-stone-500 hover:text-stone-800 font-medium"
                  >
                    {expandedId === order.id ? 'Hide' : 'Details'}
                  </button>
                </td>
              </tr>
            ))}
            {/* Expanded details row */}
            {paginated.map(order => expandedId === order.id && (
              <tr key={`${order.id}-details`} className="bg-stone-50">
                <td colSpan={6} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-stone-700 uppercase flex items-center gap-1"><Package className="w-3 h-3" /> Shipping</h4>
                      <p className="text-xs text-stone-600">{order.address}</p>
                      <p className="text-xs text-stone-500">{order.district}, {order.province}</p>
                      {order.rejectionReason && (
                        <div className="flex items-start gap-1 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{order.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-stone-700 uppercase flex items-center gap-1"><Truck className="w-3 h-3" /> Tracking</h4>
                      <input
                        placeholder="Tracking Number"
                        value={trackingInput[order.id]?.tracking ?? order.trackingNumber ?? ''}
                        onChange={e => setTrackingInput(prev => ({
                          ...prev,
                          [order.id]: {
                            tracking: e.target.value,
                            courier: prev[order.id]?.courier ?? order.courierName ?? '',
                          }
                        }))}
                        className="w-full p-2 text-xs border border-stone-200 rounded-lg"
                      />
                      <input
                        placeholder="Courier Name"
                        value={trackingInput[order.id]?.courier ?? order.courierName ?? ''}
                        onChange={e => setTrackingInput(prev => ({
                          ...prev,
                          [order.id]: {
                            courier: e.target.value,
                            tracking: prev[order.id]?.tracking ?? order.trackingNumber ?? '',
                          }
                        }))}
                        className="w-full p-2 text-xs border border-stone-200 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Payment & Admin Notes */}
                  <div className="mt-4 p-4 bg-white border border-stone-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-stone-700 uppercase">Payment & Internal Notes</h4>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-shrink-0">
                        <label className="text-xs text-stone-600 flex items-center gap-2 cursor-pointer bg-stone-50 hover:bg-stone-100 p-2 border border-stone-200 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={order.paymentReceived}
                            onChange={async (e) => {
                              const res = await togglePaymentReceived(order.id, e.target.checked);
                              if (res.success) {
                                toast.success(e.target.checked ? 'Payment marked as received' : 'Payment marked as pending');
                                router.refresh();
                              } else {
                                toast.error('Failed to update payment status');
                              }
                            }}
                            className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <span className="font-bold text-stone-900">Payment Received</span>
                        </label>
                      </div>
                      <div className="flex-1">
                        <textarea
                          placeholder="Admin notes (Internal only)"
                          defaultValue={order.adminNotes || ''}
                          onBlur={async (e) => {
                            if (e.target.value !== (order.adminNotes || '')) {
                              const res = await updateAdminNotes(order.id, e.target.value);
                              if (res.success) {
                                toast.success('Admin notes updated');
                                router.refresh();
                              } else {
                                toast.error('Failed to update notes');
                              }
                            }
                          }}
                          className="w-full text-xs p-3 border border-stone-200 rounded-lg resize-y min-h-[60px] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notification Logs */}
                  <div className="mt-6 pt-6 border-t border-stone-200">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-bold text-stone-700 uppercase flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Notification Logs
                      </h4>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            setResendingId(order.id + '-SMS');
                            const res = await resendNotification(order.id, 'SMS');
                            if (res.success) toast.success('SMS Resent');
                            setResendingId(null);
                          }}
                          disabled={!!resendingId}
                          className="flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded hover:bg-amber-100 disabled:opacity-50"
                        >
                          {resendingId === order.id + '-SMS' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                          Resend SMS
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setResendingId(order.id + '-EMAIL');
                            const res = await resendNotification(order.id, 'EMAIL');
                            if (res.success) toast.success('Email Resent');
                            setResendingId(null);
                          }}
                          disabled={!!resendingId}
                          className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 disabled:opacity-50"
                        >
                          {resendingId === order.id + '-EMAIL' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                          Resend Email
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {!order.notifications || order.notifications.length === 0 ? (
                        <p className="text-[10px] text-stone-400 italic">No notifications sent yet.</p>
                      ) : (
                        order.notifications.map((notif) => (
                          <div key={notif.id} className="flex items-center justify-between text-[10px] bg-stone-50 p-2 rounded border border-stone-100">
                            <div className="flex items-center gap-2">
                              {notif.type === 'SMS' ? <MessageSquare className="w-3 h-3 text-amber-500" /> : <Mail className="w-3 h-3 text-blue-500" />}
                              <span className="font-bold">{notif.type}</span>
                              <span className="text-stone-400">{new Date(notif.sentAt).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {notif.status === 'SUCCESS' ? (
                                <span className="text-green-600 font-bold">SENT</span>
                              ) : (
                                <div className="flex items-center gap-1 text-red-600 font-bold">
                                  <span>FAILED</span>
                                  {notif.errorMessage && <span className="text-stone-400 font-normal">({notif.errorMessage})</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {
        totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-stone-200">
            <span className="text-xs text-stone-500">
              Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="p-1.5 rounded-lg bg-stone-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg bg-stone-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )
      }

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        open={!!confirmAction}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? Please provide a reason."
        variant="danger"
        confirmLabel="Cancel Order"
        onCancel={() => { setConfirmAction(null); setCancelReason(''); }}
        onConfirm={() => {
          if (confirmAction) {
            executeStatusChange(confirmAction.orderId, confirmAction.status, confirmAction.phone, confirmAction.updatedAt, cancelReason || 'No reason provided');
          }
          setConfirmAction(null);
          setCancelReason('');
        }}
      />
      {
        confirmAction && (
          <div className="fixed inset-0 z-[51] flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto mt-32">
              <input
                autoFocus
                placeholder="Cancellation reason"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="p-2 border border-stone-200 rounded-lg text-sm w-64"
              />
            </div>
          </div>
        )
      }
    </div>
  );
};
