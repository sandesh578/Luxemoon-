import { getSiteConfig } from '@/lib/settings-server';
import { sanitizeAdminHtml } from '@/lib/sanitize-admin-html';

export const revalidate = 60;

export default async function DeliveryPolicyPage() {
    const config = (await getSiteConfig()) as any;
    const content = config?.deliveryPolicy || defaultDeliveryPolicy;

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            <section className="bg-stone-900 text-white py-16 px-4 text-center">
                <h1 className="font-serif text-4xl md:text-5xl font-bold">Delivery Policy</h1>
                <p className="text-stone-400 mt-4 max-w-lg mx-auto">How we get Luxe Moon products to your doorstep.</p>
            </section>
            <div className="max-w-4xl mx-auto px-4 py-16">
                <div className="prose-sm sm:prose-base max-w-none text-stone-600 prose-headings:font-serif prose-headings:text-stone-900 prose-a:text-amber-600" dangerouslySetInnerHTML={{ __html: sanitizeAdminHtml(content) }} />
            </div>
        </div>
    );
}

const defaultDeliveryPolicy = `
<h2>Delivery Information</h2>
<p>We deliver across the country through our trusted courier partners.</p>

<h3>Standard Delivery (Major Cities)</h3>
<ul>
  <li><strong>Estimated Delivery:</strong> 1-3 business days</li>
  <li><strong>Delivery Charge:</strong> Free on orders above a certain threshold</li>
</ul>

<h3>Outside Major Cities</h3>
<ul>
  <li><strong>Estimated Delivery:</strong> 3-7 business days</li>
  <li><strong>Delivery Charge:</strong> Standard rates apply (Free on qualifying orders)</li>
</ul>

<h3>Cash on Delivery (COD)</h3>
<p>COD is available for all orders. Payment is collected at the time of delivery.</p>

<h3>Order Tracking</h3>
<p>Once your order is shipped, you will receive an SMS with tracking details.</p>
`;
