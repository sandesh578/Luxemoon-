'use client';

import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useConfig, useI18n } from './Providers';

export function FloatingWhatsApp() {
    const pathname = usePathname();
    const rawConfig = useConfig();
    const config = rawConfig as import('./Providers').SiteConfig;
    const { t } = useI18n();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Disable on admin pages
    if (pathname.startsWith('/admin') || pathname === '/admin/login') {
        return null;
    }

    const cleanWhatsAppUrl = config.whatsappNumber
        ? `https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(t('whatsapp.helloMessage'))}`
        : `https://wa.me/9779800000000?text=${encodeURIComponent(t('whatsapp.helloMessage'))}`;

    return (
        <a
            href={cleanWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 animate-bounce group"
            aria-label={t('whatsapp.chatAriaLabel')}
        >
            <MessageCircle className="w-7 h-7" />

            {/* Tooltip */}
            <span className="absolute right-16 px-3 py-1.5 bg-white text-stone-800 text-xs font-bold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                {t('whatsapp.tooltip')}
                <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white rotate-45" />
            </span>
        </a>
    );
}
