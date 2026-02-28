'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from './Providers';
import type { Locale } from '@/lib/i18n';

const OPTIONS: Array<{ locale: Locale; label: string }> = [
  { locale: 'en', label: 'EN' },
  { locale: 'ne', label: 'ने' },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="inline-flex items-center rounded-full border border-stone-200 bg-white/80 p-1" aria-label={t('common.language')}>
      {OPTIONS.map((option) => {
        const active = option.locale === locale;
        return (
          <button
            key={option.locale}
            type="button"
            onClick={() => {
              if (active) return;
              setLocale(option.locale);
              router.refresh();
            }}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-colors ${active ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-800'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
