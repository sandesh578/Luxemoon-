import React from "react";
import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { getHomepageNotice, getSiteConfig } from "@/lib/settings";
import { validateServerEnv } from "@/lib/env";
import { getLocaleServer } from "@/lib/i18n-server";

validateServerEnv();

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif"
});

const lato = Lato({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-sans"
});

export async function generateMetadata(): Promise<Metadata> {
  const [config, locale] = await Promise.all([getSiteConfig(), getLocaleServer()]);
  const metadataBase = process.env.NEXT_PUBLIC_SITE_URL || "https://luxemoon.com.np";

  return {
    title: config.metaTitle || (locale === "ne" ? `${config.storeName} | Premium Korean Haircare` : `${config.storeName} | Nano Botox 4-in-1 Haircare`),
    description:
      config.metaDescription ||
      (locale === "ne"
        ? "LuxeMoon premium Korean haircare system for smooth, nourished, and stronger hair."
        : "LuxeMoon Nano Botox 4-in-1 haircare system: Anti-Hair Fall Shampoo, Shining Silk Hair Mask, and Soft & Silky Hair Serum."),
    metadataBase: new URL(metadataBase),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [rawConfig, noticeBar] = await Promise.all([
    getSiteConfig(),
    getHomepageNotice(),
  ]);
  const locale = await getLocaleServer();

  const config = {
    ...rawConfig,
    globalDiscountStart: rawConfig.globalDiscountStart?.toISOString() ?? null,
    globalDiscountEnd: rawConfig.globalDiscountEnd?.toISOString() ?? null,
    noticeBarText: noticeBar.noticeBarText,
    noticeBarEnabled: noticeBar.noticeBarEnabled,
  };

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        <link rel="preconnect" href="https://nominatim.openstreetmap.org" crossOrigin="" />
      </head>
      <body className={`${playfair.variable} ${lato.variable} font-sans bg-[#F6EFE7] text-[#5C3A21]`}>
        <Providers config={config} initialLocale={locale}>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <FloatingWhatsApp />
        </Providers>
      </body>
    </html>
  );
}
