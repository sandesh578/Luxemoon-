import React from "react";
import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getSiteConfig } from "@/lib/settings";

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

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getSiteConfig();

  return (
    <html lang="en">
      <body className={`${playfair.variable} ${lato.variable} font-sans bg-[#F6EFE7] text-[#5C3A21]`}>
        <Providers config={config}>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
