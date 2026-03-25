# LuxeMoon - Premium Haircare Ecommerce

LuxeMoon is a production-ready, full-stack ecommerce platform built with **Next.js 15** and **Prisma**, specifically optimized for the high-end haircare market. The system features a sophisticated dual-pricing model (Inside/Outside Core Urban Areas), automated order processing, and a comprehensive administrative control panel.

## 🚀 Key Features

- **Storefront**: High-performance, SEO-optimized shopping experience with Next.js 15 App Router.
- **Admin Dashboard**: Comprehensive management of products, categories, orders, customers, and global site settings.
- **Dual-Pricing System**: Automated logic for different pricing tiers based on delivery region.
- **Communications**: Resend (Email) & Multi-channel SMS support.
- **Secure Authentication**: Robust session management for both customers and administrators.
- **Localization**: Full support for multiple languages with a global-first approach.
- **Advanced Checkout**: Logic-heavy form with real-time address validation and delivery fee calculation.
- **Rich Media**: Cloudinary integration for high-performance image and video management.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Context & Hooks
- **Validation**: [Zod](https://github.com/colinhacks/zod)
- **Email**: [Resend](https://resend.com/)
- **Cloud Storage**: [Cloudinary](https://cloudinary.com/)

## 📂 Project Structure

- **`app/`**: Next.js App Router (Pages, API routes, Layouts).
- **`components/`**: Reusable React components (UI, Admin, Checkout).
- **`lib/`**: Centralized business logic (Region-specific data, currency formatting, auth, notifications).
- **`prisma/`**: Database schema and seed scripts.
- **`public/`**: Static assets.

## ⚙️ Environment Configuration

Refer to `.env.example` for required environment variables.
