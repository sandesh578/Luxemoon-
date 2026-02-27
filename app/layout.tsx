import React from "react";
import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { getSiteConfig } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { validateServerEnv } from "@/lib/env";

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

export const metadata: Metadata = {
  title: "Luxe Moon | Rooted in Korea. Created for the World.",
  description: "Premium Korean-origin haircare eCommerce platform.",
  metadataBase: new URL('https://luxemoon.com.np'),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [rawConfig, homepageContent] = await Promise.all([
    getSiteConfig(),
    prisma.homepageContent.findUnique({ where: { id: 1 } })
  ]);

  // Serialize Date fields to strings for the client component
  const config = {
    ...rawConfig,
    globalDiscountStart: rawConfig.globalDiscountStart?.toISOString() ?? null,
    globalDiscountEnd: rawConfig.globalDiscountEnd?.toISOString() ?? null,
    noticeBarText: homepageContent?.noticeBarText,
    noticeBarEnabled: homepageContent?.noticeBarEnabled,
  };

  return (
    <html lang="en">
      <body className={`${playfair.variable} ${lato.variable} font-sans bg-[#F6EFE7] text-[#5C3A21]`}>
        <Providers config={config}>
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
