import React from "react";
import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${lato.variable} font-sans bg-[#F6EFE7] text-[#5C3A21]`}>
        <Providers>
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