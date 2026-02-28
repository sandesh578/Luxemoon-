import { getSiteConfig } from '@/lib/settings';
import { translate } from '@/lib/i18n';
import { getLocaleServer } from '@/lib/i18n-server';
import { sanitizeAdminHtml } from '@/lib/sanitize-admin-html';

export const revalidate = 60;

export default async function AboutPage() {
  const locale = await getLocaleServer();
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  const config = await getSiteConfig();

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 min-h-screen">
      <h1 className="font-serif text-4xl font-bold text-stone-900 mb-8">{t('about.title')}</h1>
      {config.aboutContent ? (
        <div
          className="prose-sm sm:prose-base max-w-none text-stone-600 prose-headings:font-serif prose-headings:text-stone-900 prose-a:text-amber-600"
          dangerouslySetInnerHTML={{ __html: sanitizeAdminHtml(config.aboutContent) }}
        />
      ) : (
        <div className="space-y-8 text-stone-600 leading-relaxed">
          <p className="text-lg">
            {t('about.fallbackP1')}
          </p>
          <p>
            {t('about.fallbackP2')}
          </p>
          <p>
            {t('about.fallbackP3')}
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-8 text-center">
            <p className="font-serif text-2xl text-stone-900">&quot;{t('about.quote')}&quot;</p>
          </div>
        </div>
      )}
    </div>
  );
}
