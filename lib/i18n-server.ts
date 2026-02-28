import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE_NAME, type Locale } from './i18n';

export async function getLocaleServer(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
}
