import { getSiteConfig } from '@/lib/settings';
import DOMPurify from 'isomorphic-dompurify';

export const revalidate = 60;

export default async function AboutPage() {
  const config = await getSiteConfig();

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 min-h-screen">
      <h1 className="font-serif text-4xl font-bold text-stone-900 mb-8">Our Story</h1>
      {config.aboutContent ? (
        <div
          className="prose-sm sm:prose-base max-w-none text-stone-600 prose-headings:font-serif prose-headings:text-stone-900 prose-a:text-amber-600"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(config.aboutContent) }}
        />
      ) : (
        <div className="space-y-8 text-stone-600 leading-relaxed">
          <p className="text-lg">
            <strong className="text-stone-900">Luxe Moon</strong> was born from a simple belief: everyone deserves access to world-class haircare, no matter where they are.
          </p>
          <p>
            We source the finest Korean haircare formulations — enriched with Biotin, Keratin, and natural botanicals — and bring them directly to Nepal.
          </p>
          <p>
            Our products are carefully selected for their proven efficacy, premium ingredients, and salon-grade results that you can achieve at home.
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-8 text-center">
            <p className="font-serif text-2xl text-stone-900">&quot;Rooted in Korea. Created for the World.&quot;</p>
          </div>
        </div>
      )}
    </div>
  );
}