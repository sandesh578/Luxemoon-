# LuxeMoon - Production Ecommerce (Next.js + Prisma)

LuxeMoon is a production-focused haircare ecommerce site for Nepal, optimized around a 3-product system:

- Anti-Hair Fall Shampoo (500 ml)
- Shining Silk Hair Mask (500 ml)
- Soft & Silky Hair Serum (100 ml)

## Core Product Positioning

Brand line:
`LuxeMoon Nano Botox 4-in-1 | Biotin + Keratin Nanoplastia`

Approved claim set:
- pH-Balanced Formula
- Sulfate-Free
- Paraben-Free
- Silicone-Free
- Salon-Level Hair Care

## Stack

- Next.js 15 (App Router)
- TypeScript (strict)
- Prisma + PostgreSQL
- Tailwind CSS
- Cloudinary (media uploads)
- Resend + Sparrow SMS (optional notifications)

## Environment Variables

Copy `.env.example` to `.env` and set values.

Required:
- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Recommended:
- `NEXT_PUBLIC_SITE_URL` (example: `https://luxemoon.com.np`)
- `NEXT_PUBLIC_APP_ENV` (`development` or `production`)

Optional integrations:
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `SPARROW_SMS_TOKEN`

## Local Development

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

## Seed / Database Sync

Primary brand seed (recommended):

```bash
npm run seed
```

Premium content sync script:

```bash
npm run seed:premium
```

What seed does:
- Upserts `nanoplastia-collection` category
- Upserts 3 core LuxeMoon products and branding copy
- Updates homepage hero/banner/notice content
- Upserts site config defaults for Nepal store setup

## Build and Production Run

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

## Deployment Checklist (Sunday Launch)

1. Set all required env vars in hosting platform.
2. Run `npx prisma migrate deploy` in deployment pipeline.
3. Run `npm run seed` once against production DB.
4. Verify `/admin/login` access and rotate default admin password.
5. Confirm Cloudinary keys if image/video uploads are needed.
6. Test checkout flow with Kathmandu Valley and Outside Valley addresses.
7. Test order confirmation email/SMS if enabled.
8. Verify Lighthouse mobile performance and CLS before go-live.

## Admin-Configurable Areas

From Admin panel:
- Homepage: hero slides, promo banners, story image, notice bar
- Products: pricing, stock, SEO, gallery, benefits, FAQs, video
- Coupons and global discounts
- Contact/social links (Facebook, Instagram, TikTok, WhatsApp)
- Delivery charges, free-delivery threshold, ETA
- Legal/content pages and notification toggles

## Performance Notes Implemented

- Homepage revalidated with ISR (`revalidate = 120`)
- Cached SiteConfig and notice bar fetches to reduce repeat DB calls
- Dynamic metadata uses SiteConfig + `NEXT_PUBLIC_SITE_URL`
- Image optimization path applied for Cloudinary URLs
- Mobile floating WhatsApp adjusted to avoid CTA overlap

## Media Upload Guide (for best quality and speed)

Product images:
- Primary ratio: `4:5` (example 1200x1500)
- Alternate ratio: `1:1` (example 1200x1200)
- Format: WebP (preferred), JPG fallback
- Target size: 200-450 KB per image

Homepage hero:
- Desktop: `16:9` (1920x1080)
- Mobile-safe crop: keep subject centered in middle 60%
- Target size: 300-700 KB

Promo banners:
- Ratio: `16:9` (1200x675 minimum)
- Target size: 180-350 KB

Before/After transformations:
- Ratio: `4:5` or `1:1`
- Keep camera angle and lighting consistent

Short videos:
- Product reel: `9:16` (1080x1920), 15-30 sec
- Website landscape: `16:9` (1920x1080), 10-20 sec
- Format: MP4 (H.264), target 2-8 MB for short clips

## Brand Growth Features to Prioritize Next

1. UGC wall on homepage from customer reviews and before/after media.
2. Bundle builder (Shampoo + Mask + Serum) with auto discount.
3. Exit-intent coupon popup for first purchase.
4. Abandoned checkout WhatsApp recovery flow.
5. Review request automation (D+7 after delivery).
6. A/B testing for hero headline and first CTA.

## Marketing and Promotion Ideas

1. 3-step education campaign: "Cleanse, Repair, Protect".
2. Creator seeding with micro-influencers in Kathmandu, Pokhara, Butwal.
3. Salon partnership program with QR-linked referral coupons.
4. Festival campaigns with limited-time bundles and urgency timers.
5. Weekly short-form reels showing visible texture/shine changes.
6. Performance ads split by problem statement: hair fall, dryness, frizz.

## Suggested KPI Dashboard

Track weekly:
- Revenue
- Conversion rate
- Add-to-cart rate
- Checkout completion rate
- CAC by channel
- Returning customer rate
- Average order value
- Bundle attach rate

## Security and Ops

- Use strong `JWT_SECRET`
- Rotate admin credentials regularly
- Restrict database/network access on production
- Keep image upload keys secret server-side only
- Back up DB before major product or pricing updates
