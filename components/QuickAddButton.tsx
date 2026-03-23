'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/components/Providers';
import { toast } from 'sonner';

export function QuickAddButton({
    product,
    className,
    label,
    showIcon = true,
}: {
    product: any,
    className?: string,
    label?: string,
    showIcon?: boolean,
}) {
    const { addToCart } = useCart();
    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(product as any, 1);
                toast.success('Added to cart!');
            }}
            className={className || "w-full py-3 bg-stone-900 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-amber-700 transition-colors shadow-lg shadow-stone-900/10 active:scale-[0.98]"}
        >
            {showIcon ? <ShoppingBag className="w-4 h-4" /> : null}
            {label || 'QUICK ADD'}
        </button>
    );
}
