import { getSiteConfig } from '@/lib/settings';
import { sanitizeAdminHtml } from '@/lib/sanitize-admin-html';

export const revalidate = 60;

export default async function PrivacyPage() {
    const config = await getSiteConfig();

    return (
        <div className="max-w-4xl mx-auto px-4 py-16 min-h-screen">
            <h1 className="font-serif text-4xl font-bold text-stone-900 mb-8">Privacy Policy</h1>
            {config.privacyPolicy ? (
                <div
                    className="prose-sm sm:prose-base max-w-none text-stone-600 prose-headings:font-serif prose-headings:text-stone-900 prose-a:text-amber-600"
                    dangerouslySetInnerHTML={{ __html: sanitizeAdminHtml(config.privacyPolicy) }}
                />
            ) : (
                <div className="space-y-6 text-stone-600 leading-relaxed">
                    <p>This privacy policy outlines how {config.storeName} collects, uses, and protects your personal information.</p>
                    <h2 className="text-xl font-bold text-stone-900 mt-8">Information We Collect</h2>
                    <p>When you place an order, we collect your name, phone number, and delivery address. This information is used solely for order processing and delivery.</p>
                    <h2 className="text-xl font-bold text-stone-900 mt-8">How We Use Your Information</h2>
                    <p>We use your information to process orders, communicate delivery updates, and improve our services. We never sell or share your data with third parties for marketing purposes.</p>
                    <h2 className="text-xl font-bold text-stone-900 mt-8">Contact Us</h2>
                    <p>For privacy-related inquiries, contact us at {config.contactEmail} or {config.contactPhone}.</p>
                </div>
            )}
        </div>
    );
}
