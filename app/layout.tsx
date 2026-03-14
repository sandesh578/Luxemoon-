import React from "react";
import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ClientOverlays } from "@/components/ClientOverlays";
import { getHomepageNotice, getSiteConfig } from "@/lib/settings";
import { validateServerEnv } from "@/lib/env";
import { DEFAULT_LOCALE } from "@/lib/i18n";

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
  const config = await getSiteConfig();
  const metadataBase = process.env.NEXT_PUBLIC_SITE_URL || "https://luxemoon.com.np";

  return {
    title: config.metaTitle || `${config.storeName} | Nano Botox 4-in-1 Haircare`,
    description:
      config.metaDescription ||
      "LuxeMoon Nano Botox 4-in-1 haircare system: Anti-Hair Fall Shampoo, Shining Silk Hair Mask, and Soft & Silky Hair Serum.",
    metadataBase: new URL(metadataBase),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [rawConfig, noticeBar] = await Promise.all([getSiteConfig(), getHomepageNotice()]);

  const config = {
    ...rawConfig,
    globalDiscountStart: rawConfig.globalDiscountStart?.toISOString() ?? null,
    globalDiscountEnd: rawConfig.globalDiscountEnd?.toISOString() ?? null,
    noticeBarText: noticeBar.noticeBarText,
    noticeBarEnabled: noticeBar.noticeBarEnabled,
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
