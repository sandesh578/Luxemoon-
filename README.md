# Luxe Moon Haircare Website

Production-focused Next.js 15 + Prisma ecommerce website for Luxe Moon haircare.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript (strict)
- Prisma + PostgreSQL
- Tailwind CSS
- Cloudinary (media)
- Resend / Sparrow SMS (notifications)

## Environment Setup

Create `.env` from `.env.example` and configure:

```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="strong-random-secret"
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="strong-admin-password"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
RESEND_API_KEY=""
SPARROW_SMS_TOKEN=""
```

Required at runtime:

- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Local Development

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Database Migration

Development:

```bash
npx prisma migrate dev
```

Production:

```bash
npx prisma migrate deploy
```

## Build and Run

```bash
npm run lint
npm run build
npm run start
```

## Deployment Checklist

1. Set all required environment variables in your hosting platform.
2. Run `npx prisma migrate deploy` during deployment.
3. Ensure Cloudinary variables are set if media upload is enabled.
4. Run `npm run build` in CI before promoting to production.
5. Restrict admin credentials and rotate `JWT_SECRET` periodically.

