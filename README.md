# LuxeMoon - Premium Haircare Ecommerce (Nepal)

LuxeMoon is a production-ready, full-stack ecommerce platform built with **Next.js 15** and **Prisma**, specifically optimized for the high-end haircare market in Nepal. The system features a sophisticated dual-pricing model (Inside/Outside Kathmandu Valley), automated order processing, and a comprehensive administrative control panel.

## 🚀 Technical Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS + Framer Motion (Aesthetics)
- **Media**: Cloudinary (Image/Video hosting & Optimization)
- **Communications**: Resend (Email) & Sparrow SMS (Nepal-specific SMS)
- **Auth**: JWT-based session management with Edge-compatible middleware

## 🛠️ Implemented Functionality

### 1. Customer-Facing Features
- **Dynamic Product Catalog**: Optimized for a 3-product system (Shampoo, Mask, Serum) but scalable to infinite products/categories.
- **Regional Pricing Engine**: Automatically switches pricing based on delivery location (Inside vs. Outside Kathmandu Valley).
- **Advanced Checkout Flow**: 
  - Real-time address validation for Nepal (Provinces/Districts).
  - Cash on Delivery (COD) focus with automated delivery charge calculation.
  - Coupon/Discount validation with usage limits and restrictions.
- **UGC & Social Proof**: 
  - Verified purchase reviews with photo/video support.
  - "Before & After" transformation gallery linked to specific products.
- **Multi-Language Support**: Seamless toggle between English and Nepali across the entire site.
- **Responsive Design**: Mobile-first architecture with interactive elements (Floating WhatsApp, Cart Drawer).

### 2. Admin Dashboard (Security Protected)
- **Order Management**: Comprehensive lifecycle tracking from PENDING to DELIVERED, including rejection handling and admin notes.
- **Product Engine**: Full CRUD with SEO controls, marketing descriptions, ingredients list, and FAQ management.
- **Coupon System**: Advanced logic for percentage/fixed discounts, minimum order amounts, and product-specific restrictions.
- **Site Configuration**: Real-time updates for delivery fees, banner text, social links, and legal policies (Privacy, Terms, etc.) without redeployment.
- **Content Management**: Interactive control over homepage hero slides, promotional banners, and notice bars.
- **Security Logs**: Tracking of login attempts and contact form messages.

## 🔄 Application Flow

### Customer Flow
1. **Discovery**: Home -> Shop/Category pages with ISR (Incremental Static Regeneration) for performance.
2. **Engagement**: Product details with deep marketing content, reviews, and transformation proof.
3. **Cart**: Side-drawer based cart for frictionless browsing.
4. **Checkout**: Logic-heavy form with Nepal-specific location data and real-time delivery fee calculation.
5. **Confirmation**: Unique order ID generation and success tracking.

### Admin Flow
1. **Authentication**: Secure login with JWT session stored in cookies, protected by Next.js Middleware.
2. **Operations**: Dashboard summary of recent orders and messages.
3. **Control**: Direct management of inventory, media uploads (Cloudinary), and global site settings.

## 📊 Database Schema (Prisma)

The database architecture is designed for enterprise-level traceability and marketing flexibility.

### Core Tables:
- `Product`: Stores pricing (dual-mode), stock, SEO data, and rich marketing content.
- `Category`: Hierarchical organization with soft-delete support.
- `Order` & `OrderItem`: Detailed transaction logs with idempotency keys and shipping tracking.
- `Review`: Customer feedback linked to products with verification flags.
- `Transformation`: Media-heavy "Before/After" records for marketing proof.
- `Coupon`: Complex discount logic with usage tracking.
- `SiteConfig`: Singleton-style configuration for global store settings.
- `HomepageContent`: JSON-based storage for dynamic UI components like sliders and banners.
- `NotificationLog` & `NotificationTemplate`: System for tracking and managing SMS/Email communications.
- `ContactMessage`: Inbox for customer inquiries.
- `BlockedCustomer`: Phone-based fraud/spam prevention.

## 📈 Architecture Alignment

The project follows a **Modular Monolith** pattern using Next.js App Router:
- **`app/`**: Handles routing and UI (Server Components by default).
- **`app/api/`**: RESTful endpoints for client-side operations (Cart validation, Order creation).
- **`lib/`**: Centralized business logic (Nepal location data, currency formatting, auth, notifications).
- **`components/`**: Reusable UI units divided into `ui/`, `admin/`, and `products/`.
- **`prisma/`**: Data modeling and seeding scripts for rapid environment setup.

---
*Report generated for LuxeMoon Production Environment.*

## Database Sync: Supabase -> Local (One-way)

This project includes a safe one-way sync script that **reads from Supabase** and **refreshes local/on-prem DB**.
Supabase data is never modified by this flow.

### Prerequisites
- PostgreSQL client tools installed and in `PATH`:
  - `pg_dump`
  - `pg_restore`

### Environment
Set these in `.env`:
- `SUPABASE_DATABASE_URL` = production Supabase Postgres URL (source)
- `LOCAL_DATABASE_URL` = local/on-prem Postgres URL (target)
  - If `LOCAL_DATABASE_URL` is not set, the script falls back to `DATABASE_URL`

### Run
```bash
npm run db:sync:from-supabase
```

### Notes
- The script performs full local refresh using `pg_restore --clean --if-exists`.
- Local DB objects are replaced to match Supabase state.
- Source host is guarded to `*.supabase.co` unless `ALLOW_NON_SUPABASE_SOURCE=true`.
