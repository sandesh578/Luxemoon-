'use client';

import { useState, useMemo, useEffect } from 'react';
import { updateOrderStatus, togglePaymentReceived, updateAdminNotes, resendNotification } from './actions';
import {
  Loader2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Truck,
  Package,
  MessageSquare,
  Mail,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  CheckCircle2,
  Wallet,
  Clock3,
} from 'lucide-react';
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
  sentAt: Date | string;
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
  updatedAt: Date | string;
  rejectionReason?: string | null;
  trackingNumber?: string | null;
  courierName?: string | null;
  province: string;
  district: string;
  address: string;
  paymentReceived: boolean;
  adminNotes: string | null;
  createdAt: Date | string;
}

const PAGE_SIZE_OPTIONS = [50, 100, 250, 500] as const;

const getDayKey = (value: Date | string) => {
  const d = new Date(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDayLabel = (value: Date | string) =>
  new Intl.DateTimeFormat('en-NP', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));

export const AdminOrderTable = ({ orders }: { orders: Order[] }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [paymentLoadingId, setPaymentLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(100);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
  const [expandedDayKeys, setExpandedDayKeys] = useState<Set<string>>(new Set());
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
  }, [orders, statusFilter, search, startDate, endDate]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const order of orders) {
      counts[order.status] = (counts[order.status] || 0) + 1;
    }
    return counts;
  }, [orders]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  const groupedPaginated = useMemo(() => {
    const grouped = new Map<string, { label: string; orders: Order[] }>();
    for (const order of paginated) {
      const key = getDayKey(order.createdAt);
      if (!grouped.has(key)) {
        grouped.set(key, { label: getDayLabel(order.createdAt), orders: [] });
      }
      grouped.get(key)!.orders.push(order);
    }
    return Array.from(grouped.entries()).map(([key, value]) => ({ key, ...value }));
  }, [paginated]);

  const dayTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const order of filtered) {
      const key = getDayKey(order.createdAt);
      totals.set(key, (totals.get(key) || 0) + 1);
    }
    return totals;
  }, [filtered]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setExpandedDayKeys(new Set(groupedPaginated.map(group => group.key)));
    setExpandedOrderIds(new Set());
  }, [page, pageSize, statusFilter, search, startDate, endDate, groupedPaginated]);

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

  const toggleDay = (dayKey: string) => {
    setExpandedDayKeys(prev => {
      const next = new Set(prev);
      if (next.has(dayKey)) next.delete(dayKey);
      else next.add(dayKey);
      return next;
    });
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const expandAllDays = () => {
    setExpandedDayKeys(new Set(groupedPaginated.map(group => group.key)));
  };

  const collapseAllDays = () => {
    setExpandedDayKeys(new Set());
  };

  const expandAllOrdersOnPage = () => {
    setExpandedOrderIds(new Set(paginated.map(order => order.id)));
  };

  const collapseAllOrders = () => {
    setExpandedOrderIds(new Set());
  };

  const handlePaymentToggle = async (orderId: string, received: boolean) => {
    setPaymentLoadingId(orderId);
    const res = await togglePaymentReceived(orderId, received);
    setPaymentLoadingId(null);
    if (res.success) {
      toast.success(received ? 'Payment marked as received' : 'Payment marked as pending');
      router.refresh();
    } else {
      toast.error('Failed to update payment status');
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="p-4 border-b border-stone-200 space-y-3 bg-gradient-to-r from-stone-50 to-amber-50/30">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setStatusFilter('ALL'); setPage(1); }}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${statusFilter === 'ALL' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
            All ({orders.length})
          </button>
          {ORDER_STATUSES.map(s => {
            const count = statusCounts[s] || 0;
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
          <select
            value={String(pageSize)}
            onChange={e => { setPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number]); setPage(1); }}
            className="p-2 text-xs border border-stone-200 rounded-lg outline-none focus:border-amber-500 bg-white"
            aria-label="Orders per page"
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={expandAllDays}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:border-amber-400 transition-colors"
          >
            Expand All Days
          </button>
          <button
            type="button"
            onClick={collapseAllDays}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:border-amber-400 transition-colors"
          >
            Collapse All Days
          </button>
          <button
            type="button"
            onClick={expandAllOrdersOnPage}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:border-amber-400 transition-colors"
          >
            Expand All Orders
          </button>
          <button
            type="button"
            onClick={collapseAllOrders}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:border-amber-400 transition-colors"
          >
            Collapse All Orders
          </button>
        </div>
      </div>

      {/* Day-wise grouped orders */}
      <div className="p-4 space-y-4">
        {filtered.length === 0 && (
          <div className="border border-stone-200 rounded-2xl p-8 text-center bg-stone-50">
            <p className="text-sm text-stone-600">No orders found for the selected filters.</p>
          </div>
        )}

        {groupedPaginated.map(group => {
          const isDayExpanded = expandedDayKeys.has(group.key);
          return (
            <section key={group.key} className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <button
                type="button"
                onClick={() => toggleDay(group.key)}
                className="w-full px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between hover:bg-stone-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-stone-900 text-sm">{group.label}</span>
                  <span className="text-xs text-stone-500">({group.orders.length} on this page / {dayTotals.get(group.key) || 0} total)</span>
                </div>
                {isDayExpanded ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
              </button>

              {isDayExpanded && (
                <div className="divide-y divide-stone-100">
                  {group.orders.map(order => {
                    const isExpanded = expandedOrderIds.has(order.id);
                    const createdAt = new Date(order.createdAt);
                    const updatedAt = new Date(order.updatedAt);
                    return (
                      <article key={order.id} className="p-4 md:p-5 hover:bg-stone-50/50 transition-colors">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-start">
                          <div className="md:col-span-3">
                            <div className="font-mono text-xs text-stone-500">#{order.id.slice(-8)}</div>
                            <div className="flex items-center gap-1 mt-1 text-[11px] text-stone-500">
                              <Clock3 className="w-3 h-3" />
                              {createdAt.toLocaleString()}
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                              <Truck className="w-3 h-3" />
                              {order.isInsideValley ? 'Inside Valley' : 'Outside Valley'}
                            </div>
                          </div>

                          <div className="md:col-span-2">
                            <div className="font-bold text-stone-900 text-sm">{order.customerName}</div>
                            <div className="text-xs text-stone-500">{order.phone}</div>
                            <div className="text-xs text-stone-500 truncate mt-1">{order.district}, {order.province}</div>
                          </div>

                          <div className="md:col-span-3 space-y-1">
                            {order.items.slice(0, 3).map((item) => (
                              <div key={item.id} className="text-xs text-stone-600">
                                <span className="font-bold">{item.quantity}x</span> {item.product.name}
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <div className="text-xs text-stone-400">+{order.items.length - 3} more items</div>
                            )}
                          </div>

                          <div className="md:col-span-2">
                            <div className="text-sm font-bold text-stone-900">NPR {order.total.toLocaleString()}</div>
                            <div className="mt-2">
                              <select
                                className={`w-full text-xs font-bold rounded-full px-3 py-1.5 border-none focus:ring-2 focus:ring-amber-500 cursor-pointer ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}
                                value={order.status}
                                disabled={loadingId === order.id}
                                onChange={(e) => handleStatusChange(order.id, e.target.value, order.phone, updatedAt)}
                              >
                                {ORDER_STATUSES.map(s => (
                                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                ))}
                              </select>
                              {loadingId === order.id && <Loader2 className="w-4 h-4 animate-spin text-stone-400 mt-1" />}
                            </div>
                          </div>

                          <div className="md:col-span-2 space-y-2">
                            <button
                              type="button"
                              onClick={() => toggleOrderDetails(order.id)}
                              className="w-full text-xs font-semibold rounded-lg px-3 py-2 border border-stone-200 bg-white hover:border-amber-400 transition-colors"
                            >
                              {isExpanded ? 'Hide Details' : 'View Details'}
                            </button>

                            <button
                              type="button"
                              disabled={paymentLoadingId === order.id}
                              onClick={() => handlePaymentToggle(order.id, !order.paymentReceived)}
                              className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 border transition-colors ${order.paymentReceived ? 'bg-green-50 border-green-200 text-green-700' : 'bg-stone-50 border-stone-200 text-stone-700'} ${paymentLoadingId === order.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              <span className="text-[11px] font-bold">Payment</span>
                              <span className="inline-flex items-center gap-1">
                                {paymentLoadingId === order.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : order.paymentReceived ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                  <Wallet className="w-3.5 h-3.5" />
                                )}
                                <span className="text-[11px] font-semibold">{order.paymentReceived ? 'Received' : 'Pending'}</span>
                              </span>
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 bg-stone-50 border border-stone-200 rounded-2xl p-4 md:p-5 space-y-5 animate-in fade-in duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-stone-700 uppercase flex items-center gap-1"><Package className="w-3 h-3" /> Shipping</h4>
                                <p className="text-xs text-stone-700 leading-relaxed">{order.address}</p>
                                <p className="text-xs text-stone-500">{order.district}, {order.province}</p>
                                {order.rejectionReason && (
                                  <div className="flex items-start gap-1 text-xs text-red-700 bg-red-50 p-2 rounded-lg border border-red-100">
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
                                  className="w-full p-2 text-xs border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-200"
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
                                  className="w-full p-2 text-xs border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-200"
                                />
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-stone-700 uppercase">Internal Notes</h4>
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
                                  className="w-full text-xs p-3 border border-stone-200 rounded-lg resize-y min-h-[90px] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                />
                              </div>
                            </div>

                            <div className="pt-1">
                              <h4 className="text-xs font-bold text-stone-700 uppercase mb-2">All Items</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {order.items.map(item => (
                                  <div key={item.id} className="text-xs bg-white border border-stone-200 rounded-lg p-2 flex items-center justify-between gap-2">
                                    <span className="text-stone-700 truncate">{item.product.name}</span>
                                    <span className="font-semibold text-stone-900 whitespace-nowrap">{item.quantity}x NPR {item.price.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="pt-4 border-t border-stone-200">
                              <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
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
                                    <div key={notif.id} className="flex flex-wrap items-center justify-between gap-2 text-[10px] bg-white p-2 rounded border border-stone-200">
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
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Pagination */}
      {
        filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-t border-stone-200 gap-2">
            <span className="text-xs text-stone-500">
              Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="p-1.5 rounded-lg bg-stone-100 disabled:opacity-30 hover:bg-stone-200 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs px-2 py-1.5 text-stone-600 font-semibold">Page {page} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg bg-stone-100 disabled:opacity-30 hover:bg-stone-200 transition-colors"><ChevronRight className="w-4 h-4" /></button>
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
