import type { Metadata } from "next";
import { Geist, Geist_Mono, Chakra_Petch, DM_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "./components/CookieBanner";

// CookieBanner es Client Component ('use client'). Devuelve null en el render
// inicial y solo lee localStorage dentro de useEffect, por lo que es SSR-safe
// y no necesita `dynamic({ ssr: false })`. Next.js 16 prohíbe ssr:false en
// Server Components — esta es la forma canónica vigente.

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "1503 — El internet del comercio global",
  description:
    "Pasaporte Digital de Producto y cumplimiento de exportación en una sola herramienta. Genera el DPP de tus productos y cumple la normativa para exportar a cualquier país.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${chakraPetch.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
