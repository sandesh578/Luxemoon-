import SettingsClient from './SettingsClient';
import { getSiteConfigForAdmin } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const config = await getSiteConfigForAdmin();

  return (
    <SettingsClient
      initialData={{
        ...config,
        globalDiscountStart: config.globalDiscountStart?.toISOString() ?? null,
        globalDiscountEnd: config.globalDiscountEnd?.toISOString() ?? null,
      }}
    />
  );
}
