'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, MapPin, Package, LogOut, Loader2, Plus, Pencil, Trash2, Star, ChevronRight, Phone, Mail } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

type Tab = 'profile' | 'addresses' | 'orders';

const isTab = (value: string | null): value is Tab =>
  value === 'profile' || value === 'addresses' || value === 'orders';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
}

interface Address {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  city: string;
  address: string;
  landmark: string | null;
  isDefault: boolean;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { name: string; images: string[]; slug: string };
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  customerName: string;
  trackingNumber: string | null;
  courierName: string | null;
  items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Profile edit state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Address modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({ fullName: '', phone: '', province: '', district: '', city: '', address: '', landmark: '', isDefault: false });
  const [addressSaving, setAddressSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    const res = await fetch('/api/user/profile');
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setEditName(data.name);
      setEditPhone(data.phone || '');
    }
  }, []);

  const fetchAddresses = useCallback(async () => {
    const res = await fetch('/api/user/addresses');
    if (res.ok) setAddresses(await res.json());
  }, []);

  const fetchOrders = useCallback(async (page = 1) => {
    const res = await fetch(`/api/user/orders?page=${page}`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
      setOrdersTotalPages(data.totalPages);
      setOrdersPage(data.currentPage);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProfile(), fetchAddresses(), fetchOrders()]).finally(() => setLoading(false));
  }, [fetchProfile, fetchAddresses, fetchOrders]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (isTab(tab)) {
      setActiveTab(tab);
      return;
    }
    setActiveTab('profile');
  }, [searchParams]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    router.replace(tab === 'profile' ? '/account' : `/account?tab=${tab}`, { scroll: false });
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileMsg('');
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, phone: editPhone || null }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(prev => prev ? { ...prev, ...data } : prev);
      setProfileMsg('Profile updated successfully');
    } else {
      setProfileMsg('Failed to update profile');
    }
    setProfileSaving(false);
    setTimeout(() => setProfileMsg(''), 3000);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  const openAddressModal = (addr?: Address) => {
    if (addr) {
      setEditingAddress(addr);
      setAddressForm({
        fullName: addr.fullName, phone: addr.phone, province: addr.province,
        district: addr.district, city: addr.city, address: addr.address,
        landmark: addr.landmark || '', isDefault: addr.isDefault,
      });
    } else {
      setEditingAddress(null);
      setAddressForm({ fullName: '', phone: '', province: '', district: '', city: '', address: '', landmark: '', isDefault: false });
    }
    setShowAddressModal(true);
  };

  const handleAddressSave = async () => {
    setAddressSaving(true);
    const method = editingAddress ? 'PUT' : 'POST';
    const body = editingAddress ? { id: editingAddress.id, ...addressForm } : addressForm;
    const res = await fetch('/api/user/addresses', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) {
      await fetchAddresses();
      setShowAddressModal(false);
    }
    setAddressSaving(false);
  };

  const handleAddressDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    await fetch(`/api/user/addresses?id=${id}`, { method: 'DELETE' });
    await fetchAddresses();
  };

  const handleSetDefault = async (id: string) => {
    await fetch('/api/user/addresses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isDefault: true }),
    });
    await fetchAddresses();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6EFE7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  const tabs = [
    { key: 'profile' as Tab, label: 'Profile', icon: User },
    { key: 'addresses' as Tab, label: 'Addresses', icon: MapPin },
    { key: 'orders' as Tab, label: 'Orders', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        {/* Header Section */}
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight">My Account</h1>
              <div className="flex items-center gap-2 text-stone-500">
                <p className="text-sm font-medium">Welcome back, <span className="text-amber-800">{profile?.name}</span></p>
                <span className="w-1 h-1 rounded-full bg-stone-300" />
                <p className="text-[10px] uppercase tracking-widest font-bold">Member since {new Date(profile?.createdAt || '').getFullYear()}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-stone-200 text-sm font-bold text-stone-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-95 w-fit"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation - Fixed for mobile and enhanced for premium feel */}
        <div className="relative mb-12">
          <div className="bg-white rounded-[20px] p-1.5 shadow-sm border border-stone-100 flex items-center w-full">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-[14px] text-xs md:text-sm font-bold transition-all duration-500 whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/10'
                    : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50/80'
                }`}
              >
                <tab.icon className={`w-4 h-4 transition-transform duration-500 ${activeTab === tab.key ? 'scale-110' : ''}`} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
          {/* ─── PROFILE TAB ─── */}
          {activeTab === 'profile' && profile && (
            <div className="bg-white rounded-[32px] shadow-sm border border-stone-100 p-8 md:p-12 max-w-3xl">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center border border-amber-100 shadow-inner">
                  <User className="w-7 h-7 text-amber-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-stone-900">Personal Information</h2>
                  <p className="text-sm text-stone-500">Manage your profile details and preferences.</p>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-stone-100 bg-stone-50/50 text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-200/50 focus:bg-white transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-1">Phone Number</label>
                    <div className="relative group">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-amber-600" />
                      <input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+977 98XXXXXXXX"
                        className="w-full pl-12 pr-5 py-4 rounded-2xl border border-stone-100 bg-stone-50/50 text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-200/50 focus:bg-white transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                  <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-stone-50/80 border border-stone-100 text-sm text-stone-500">
                    <Mail className="w-4 h-4" />
                    <span className="font-medium">{profile.email}</span>
                    <span className="ml-auto text-[9px] bg-stone-200 text-stone-500 px-2 py-0.5 rounded-full font-bold">LOCKED</span>
                  </div>
                  <p className="text-[11px] text-stone-400 ml-1">For security, your email cannot be modified once verified.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                  <button
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    className="w-full sm:w-auto px-10 py-4 bg-stone-900 text-white text-sm font-bold rounded-full hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-3"
                  >
                    {profileSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                  {profileMsg && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full animate-in fade-in slide-in-from-left-2 ${profileMsg.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-bold">{profileMsg}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* ─── ADDRESSES TAB ─── */}
        {activeTab === 'addresses' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Delivery Addresses</h2>
                <p className="text-sm text-stone-500">Your saved locations for faster checkout.</p>
              </div>
              <button
                onClick={() => openAddressModal()}
                className="flex items-center justify-center gap-2 px-8 py-3.5 bg-stone-900 text-white text-sm font-bold rounded-full hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10 active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add New Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="bg-white rounded-[40px] shadow-sm border border-stone-100 p-20 text-center">
                <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-10 h-10 text-stone-200" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">No addresses saved yet</h3>
                <p className="text-stone-500 max-w-xs mx-auto mb-8">Save your delivery details now to breeze through your next purchase.</p>
                <button onClick={() => openAddressModal()} className="px-8 py-3 bg-stone-100 text-stone-700 font-bold rounded-full hover:bg-stone-200 transition-all">
                  Create First Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.map(addr => (
                  <div key={addr.id} className="group bg-white rounded-[32px] shadow-sm border border-stone-100 p-6 md:p-8 relative hover:shadow-xl hover:shadow-stone-900/5 transition-all duration-500 border-l-4 border-l-transparent hover:border-l-amber-500">
                    {addr.isDefault && (
                      <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-100 shadow-sm">
                        <Star className="w-3 h-3 fill-amber-500" /> DEFAULT
                      </div>
                    )}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center border border-stone-100">
                        <MapPin className="w-5 h-5 text-stone-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900">{addr.fullName}</h3>
                        <p className="text-xs font-medium text-stone-500">{addr.phone}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1 mb-8">
                      <p className="text-sm text-stone-700 leading-relaxed font-medium">
                        {addr.address}, {addr.city}
                      </p>
                      <p className="text-sm text-stone-500">
                        {addr.district}, {addr.province}
                      </p>
                      {addr.landmark && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-stone-50 rounded-lg text-[11px] text-stone-400 font-medium">
                          <Plus className="w-3 h-3" /> Landmark: {addr.landmark}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 pt-6 border-t border-stone-50">
                      <button onClick={() => openAddressModal(addr)} className="flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => handleAddressDelete(addr.id)} className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-700 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                      {!addr.isDefault && (
                        <button onClick={() => handleSetDefault(addr.id)} className="ml-auto text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline transition-colors">
                          Set as default
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Address Modal with premium gradient styling */}
            {showAddressModal && (
              <div
                className="fixed inset-0 z-[150] overflow-y-auto bg-black/40 backdrop-blur-[3px] px-4 py-10 sm:py-12 animate-fade-in"
                onClick={() => setShowAddressModal(false)}
              >
                <div
                  className="relative mx-auto max-w-3xl rounded-[48px] border border-stone-100 bg-gradient-to-br from-[#fff9f4] via-[#fff3ea] to-[#fef6ed] p-8 shadow-[0_35px_80px_rgba(14,10,4,0.35)]"
                  style={{ boxShadow: '0 30px 70px rgba(15,8,3,0.28)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-1.5 w-20 rounded-full bg-amber-200/80 shadow-[0_10px_20px_rgba(204,132,61,0.5)]" />
                  <div className="flex flex-col gap-1 text-center mb-8">
                    <p className="text-[10px] uppercase tracking-[0.45em] text-stone-400 font-bold">Delivery Details</p>
                    <h3 className="text-3xl font-serif font-bold text-stone-900">{editingAddress ? 'Update Address' : 'New Address'}</h3>
                    <p className="text-sm text-stone-500">Save a premium delivery location to fast-track your Luxe Moon rituals.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {(['fullName', 'phone', 'province', 'district', 'city', 'address', 'landmark'] as const).map(field => (
                      <div key={field} className={field === 'address' ? 'sm:col-span-2' : ''}>
                        <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-[0.35em] mb-2 block">
                          {field === 'fullName' ? 'Receiver Name' : field}
                          {!['landmark'].includes(field) && <span className="text-amber-600 ml-1">*</span>}
                        </label>
                        <input
                          value={addressForm[field]}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, [field]: e.target.value }))}
                          required={field !== 'landmark'}
                          placeholder={field === 'landmark' ? 'Optional (e.g. Near Big Mart)' : ''}
                          className="w-full rounded-[28px] border border-stone-200 bg-white/80 px-5 py-3.5 text-sm font-semibold text-stone-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200 focus:bg-white"
                        />
                      </div>
                    ))}
                    <div className="sm:col-span-2 flex items-center gap-3 rounded-[24px] border border-amber-200/50 bg-white/60 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                        className="h-5 w-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                      />
                      <label htmlFor="isDefault" className="text-sm font-bold text-amber-900 cursor-pointer">
                        Set as my default delivery address
                      </label>
                    </div>
                  </div>

                  <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => setShowAddressModal(false)}
                      className="flex-1 rounded-[999px] border border-stone-200 bg-white/80 px-6 py-4 text-sm font-bold text-stone-600 transition hover:bg-white focus:outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddressSave}
                      disabled={addressSaving}
                      className="flex-1 rounded-[999px] bg-gradient-to-r from-amber-500 via-amber-600 to-stone-900 px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-[0_15px_45px_rgba(71,40,10,0.45)] transition hover:opacity-90 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {addressSaving && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                      {editingAddress ? 'Update Address' : 'Save Address'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── ORDERS TAB ─── */}
        {activeTab === 'orders' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-stone-900">Your Orders</h2>
              <p className="text-sm text-stone-500">Track and manage your recent purchases.</p>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white rounded-[40px] shadow-sm border border-stone-100 p-20 text-center">
                <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-10 h-10 text-stone-200" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">No orders found</h3>
                <p className="text-stone-500 max-w-xs mx-auto mb-8">You have not placed any orders yet. Explore our curated collections to start your beauty journey.</p>
                <Link href="/shop" className="px-10 py-4 bg-stone-900 text-white font-bold rounded-full hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10 active:scale-95 inline-flex items-center gap-3">
                  Start Shopping <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map(order => (
                  <div key={order.id} className="bg-white rounded-[32px] shadow-sm border border-stone-100 overflow-hidden hover:shadow-xl transition-all duration-500">
                    <div className="p-6 md:p-8 bg-stone-50/50 border-b border-stone-100">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-stone-100">
                            <Package className="w-5 h-5 text-stone-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none mb-1">Order Ref</p>
                            <p className="text-sm font-bold text-stone-900 font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-8">
                          <div className="hidden sm:block text-right">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none mb-1">Placed On</p>
                            <p className="text-xs font-bold text-stone-600">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`px-3 py-1 text-[10px] font-bold rounded-full border mb-1.5 ${STATUS_COLORS[order.status] || 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                              {order.status}
                            </span>
                            <p className="font-bold text-stone-900 tracking-tight">${order.total.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 md:p-8 space-y-6">
                      {order.trackingNumber && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-amber-50/40 rounded-2xl border border-amber-100/50">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-xs font-bold text-amber-900">TRACKING SHIPMENT</span>
                          </div>
                          <div className="text-xs text-amber-800">
                            <span className="font-medium">Number:</span> <span className="font-mono font-bold">{order.trackingNumber}</span>
                            {order.courierName && <span className="mx-2 opacity-30">|</span>}
                            {order.courierName && <span className="font-medium">Carrier: {order.courierName}</span>}
                          </div>
                        </div>
                      )}
                      
                      <div className="divide-y divide-stone-50">
                        {order.items.map(item => (
                          <div key={item.id} className="flex items-center gap-5 py-4 first:pt-0 last:pb-0 group">
                            <div className="w-16 h-16 rounded-2xl bg-stone-50 overflow-hidden shrink-0 relative border border-stone-100 group-hover:shadow-md transition-shadow">
                              {item.product.images?.[0] && (
                                <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="64px" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link href={`/products/${item.product.slug}`} className="text-sm font-bold text-stone-900 hover:text-amber-800 transition-colors truncate block mb-0.5">
                                {item.product.name}
                              </Link>
                              <div className="flex items-center gap-3">
                                <p className="text-xs text-stone-400 font-medium">Qty: {item.quantity}</p>
                                <span className="text-[10px] text-stone-200">•</span>
                                <p className="text-xs font-bold text-stone-600">${item.price.toFixed(2)} each</p>
                              </div>
                            </div>
                            <Link href={`/products/${item.product.slug}`} className="p-2 rounded-full border border-stone-100 text-stone-300 hover:text-stone-900 hover:border-stone-300 transition-all hidden sm:block">
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {ordersTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-8">
                    {Array.from({ length: ordersTotalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => fetchOrders(p)}
                        className={`w-10 h-10 rounded-xl text-xs font-bold transition-all duration-300 ${
                          p === ordersPage 
                            ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/10 scale-110' 
                            : 'bg-white border border-stone-100 text-stone-400 hover:text-stone-900 hover:border-stone-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
