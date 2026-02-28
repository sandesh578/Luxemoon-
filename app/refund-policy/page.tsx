import { getSiteConfig } from '@/lib/settings';
import { sanitizeAdminHtml } from '@/lib/sanitize-admin-html';

export const revalidate = 60;

export default async function RefundPolicyPage() {
    const config = (await getSiteConfig()) as any;
    const content = config?.refundPolicy || defaultRefundPolicy;

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            <section className="bg-stone-900 text-white py-16 px-4 text-center">
                <h1 className="font-serif text-4xl md:text-5xl font-bold">Refund & Return Policy</h1>
                <p className="text-stone-400 mt-4 max-w-lg mx-auto">Your satisfaction is our priority.</p>
            </section>
            <div className="max-w-4xl mx-auto px-4 py-16">
                <div className="prose-sm sm:prose-base max-w-none text-stone-600 prose-headings:font-serif prose-headings:text-stone-900 prose-a:text-amber-600" dangerouslySetInnerHTML={{ __html: sanitizeAdminHtml(content) }} />
            </div>
        </div>
    );
}

const defaultRefundPolicy = `
<h2>Return & Refund Policy</h2>
<p>We want you to be completely satisfied with your purchase. If you are not happy with your order, we offer the following:</p>

<h3>Returns</h3>
<ul>
  <li>Products can be returned within <strong>7 days</strong> of delivery.</li>
  <li>Items must be <strong>unused, unopened, and in original packaging</strong>.</li>
  <li>Contact us via WhatsApp or phone to initiate a return.</li>
</ul>

<h3>Refunds</h3>
<ul>
  <li>Refunds will be processed within <strong>5-7 business days</strong> after receiving the returned item.</li>
  <li>Refunds will be issued to the original payment method or as store credit.</li>
  <li>Delivery charges are non-refundable.</li>
</ul>

<h3>Damaged or Defective Products</h3>
<p>If you receive a damaged or defective product, please contact us within 48 hours of delivery with photos. We will arrange a free replacement or full refund.</p>

<h3>Non-Returnable Items</h3>
<p>For hygiene reasons, opened hair care products cannot be returned unless they are defective.</p>
`;
