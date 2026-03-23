'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Package, UserRound } from 'lucide-react';

interface ProfileDropdownProps {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export function ProfileDropdown({ open, onClose, isMobile }: ProfileDropdownProps) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [open, onClose]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      onClose();
      router.push('/');
      router.refresh();
    }
  };

  const menuItems = (
    <div className="space-y-1">
      <Link 
        href="/account" 
        onClick={onClose} 
        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 hover:text-amber-800 cursor-pointer rounded-xl transition-all active:scale-[0.98] group"
      >
        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
          <UserRound className="w-4 h-4 text-stone-500 group-hover:text-amber-700" />
        </div>
        My Account
      </Link>
      <Link 
        href="/account?tab=orders" 
        onClick={onClose} 
        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 hover:text-amber-800 cursor-pointer rounded-xl transition-all active:scale-[0.98] group"
      >
        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
          <Package className="w-4 h-4 text-stone-500 group-hover:text-amber-700" />
        </div>
        My Orders
      </Link>
      <div className="h-px bg-stone-100 my-1 mx-2" />
      <button
        type="button"
        onClick={handleLogout}
        className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 cursor-pointer rounded-xl transition-all active:scale-[0.98] group"
      >
        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
          <LogOut className="w-4 h-4 text-red-500" />
        </div>
        Sign Out
      </button>
    </div>
  );

  return (
    <>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close profile menu"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] animate-fade-in"
          />

          {isMobile ? (
          <div
            className="fixed inset-x-0 top-[5.25rem] z-[120] px-4"
          >
            <div className="relative bg-white/95 border border-stone-100 rounded-[34px] shadow-[0_35px_60px_rgba(15,8,3,0.25)] p-6 max-h-[calc(100vh-6rem)] overflow-y-auto animate-in slide-in-from-top duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-1.5 w-16 rounded-full bg-amber-100/80 shadow-[0_15px_30px_rgba(167,110,46,0.35)]" />
              <div className="px-1 pb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400 mb-3">Account</p>
                {menuItems}
              </div>
            </div>
          </div>
          ) : (
            <div
              className="absolute right-0 mt-4 w-64 bg-white rounded-3xl shadow-[0_20px_50px_rgba(92,58,33,0.15)] border border-stone-50 p-2 z-[120] animate-in fade-in zoom-in-95 duration-300 origin-top-right"
            >
              <div className="px-4 py-3 border-b border-stone-50 mb-1">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Account Menu</p>
              </div>
              {menuItems}
            </div>
          )}
        </>
      )}
    </>
  );
}
