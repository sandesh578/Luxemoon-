import React from "react";
import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ClientOverlays } from "@/components/ClientOverlays";
import { getHomepageNotice, getSiteConfig } from "@/lib/settings-server";
import { validateServerEnv } from "@/lib/env";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { normalizeCurrencyCode } from "@/lib/currency";

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
  try {
    validateServerEnv();
  } catch (e) {
    console.warn("Environment validation skipped or failed during build:", e instanceof Error ? e.message : e);
  }
  const config = await getSiteConfig();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.luxemoonbeauty.com";

  return {
    title: {
      default: config.metaTitle || "LuxeMoon | Official Korean Beauty & Haircare",
      template: `%s | ${config.storeName || 'LuxeMoon'}`,
    },
    description:
      config.metaDescription ||
      "LuxeMoon Nano Botox 4-in-1 cosmetics system: Anti-Hair Fall Shampoo, Shining Silk Hair Mask, and Soft & Silky Hair Serum.",
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: config.metaTitle || "LuxeMoon | Official Korean Beauty",
      description: config.metaDescription || undefined,
      url: baseUrl,
      siteName: config.storeName || 'LuxeMoon',
      locale: 'en_US',
      type: 'website',
    },
    icons: {
      icon: config.faviconUrl || "/favicon.ico",
      shortcut: config.faviconUrl || "/favicon.ico",
      apple: config.faviconUrl || "/favicon.ico",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  try {
    validateServerEnv();
  } catch (e) {
    // During build, we might not have all env vars. We log but continue 
    // because getSiteConfig has fallbacks.
    console.warn("Environment validation skipped or failed in RootLayout:", e instanceof Error ? e.message : e);
  }
  const [rawConfig, noticeBar] = await Promise.all([getSiteConfig(), getHomepageNotice()]);

  const config = {
    ...rawConfig,
    globalDiscountStart: rawConfig.globalDiscountStart?.toISOString() ?? null,
    globalDiscountEnd: rawConfig.globalDiscountEnd?.toISOString() ?? null,
    noticeBarText: noticeBar.noticeBarText,
    noticeBarEnabled: noticeBar.noticeBarEnabled,
    noticeBarStill: noticeBar.noticeBarStill,
    currencyCode: normalizeCurrencyCode(rawConfig.currencyCode),
  };

  return (
    <html lang={DEFAULT_LOCALE}>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        <link rel="preconnect" href="https://nominatim.openstreetmap.org" crossOrigin="" />
      </head>
      <body className={`${playfair.variable} ${lato.variable} font-sans bg-[#F6EFE7] text-[#5C3A21]`}>
        <Providers config={config} initialLocale={DEFAULT_LOCALE}>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <ClientOverlays />
        </Providers>
      </body>
    </html>
  );
}
