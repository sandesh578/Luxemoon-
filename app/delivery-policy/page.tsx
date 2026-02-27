import { getSiteConfig } from '@/lib/settings';
import DOMPurify from 'isomorphic-dompurify';

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
                <div className="prose-sm sm:prose-base max-w-none text-stone-600 prose-headings:font-serif prose-headings:text-stone-900 prose-a:text-amber-600" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
            </div>
        </div>
    );
}

const defaultDeliveryPolicy = `
<h2>Delivery Information</h2>
<p>We deliver across Nepal through our trusted courier partners.</p>

<h3>Inside Kathmandu Valley</h3>
<ul>
  <li><strong>Estimated Delivery:</strong> 1-2 business days</li>
  <li><strong>Delivery Charge:</strong> Free on orders above NPR 5,000</li>
</ul>

<h3>Outside Kathmandu Valley</h3>
<ul>
  <li><strong>Estimated Delivery:</strong> 3-5 business days</li>
  <li><strong>Delivery Charge:</strong> NPR 150 (Free on orders above NPR 5,000)</li>
</ul>

<h3>Cash on Delivery (COD)</h3>
<p>COD is available for all orders across Nepal. Payment is collected at the time of delivery.</p>

<h3>Order Tracking</h3>
<p>Once your order is shipped, you will receive an SMS with tracking details.</p>
`;
