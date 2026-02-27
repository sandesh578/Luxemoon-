'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

export function SortDropdown() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get('sort') || '';

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) {
            params.set('sort', e.target.value);
        } else {
            params.delete('sort');
        }
        router.push(`/shop?${params.toString()}`);
    };

    return (
        <div className="relative inline-block">
            <select
                value={currentSort}
                onChange={handleSortChange}
                className="appearance-none bg-white border border-stone-200 text-stone-700 py-2 pl-4 pr-10 rounded-full text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
                <option value="">Sort By: Default</option>
                <option value="bestselling">Best Selling</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
        </div>
    );
}
