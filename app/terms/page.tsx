import { getSiteConfig } from '@/lib/settings';
import { sanitizeAdminHtml } from '@/lib/sanitize-admin-html';

export const revalidate = 60;

export default async function TermsPage() {
    const config = await getSiteConfig();

    return (
        <div className="max-w-4xl mx-auto px-4 py-16 min-h-screen">
            <h1 className="font-serif text-4xl font-bold text-stone-900 mb-8">Terms & Conditions</h1>
            {config.termsConditions ? (
                <div
                    className="prose-sm sm:prose-base max-w-none text-stone-600 prose-headings:font-serif prose-headings:text-stone-900 prose-a:text-amber-600"
                    dangerouslySetInnerHTML={{ __html: sanitizeAdminHtml(config.termsConditions) }}
                />
            ) : (
                <div className="space-y-6 text-stone-600 leading-relaxed">
                    <p>By using {config.storeName}, you agree to the following terms and conditions.</p>
                    <h2 className="text-xl font-bold text-stone-900 mt-8">Orders & Payment</h2>
                    <p>All orders are Cash on Delivery (COD). We reserve the right to cancel orders due to stock unavailability or suspicious activity.</p>
                    <h2 className="text-xl font-bold text-stone-900 mt-8">Delivery</h2>
                    <p>Delivery times are estimated and may vary. Inside Kathmandu Valley: {config.estimatedDeliveryInside}. Outside Valley: {config.estimatedDeliveryOutside}.</p>
                    <h2 className="text-xl font-bold text-stone-900 mt-8">Returns & Refunds</h2>
                    <p>Unopened and unused products can be returned within 7 days of delivery for a full refund. Please contact us before returning any products.</p>
                    <h2 className="text-xl font-bold text-stone-900 mt-8">Contact</h2>
                    <p>For questions about these terms, contact us at {config.contactEmail}.</p>
                </div>
            )}
        </div>
    );
}
