import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";

import { AppShell } from "@/components/layout/app-shell";
import { getSiteUrl } from "@/lib/env";

import "./globals.css";

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const monoFont = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "BizScrape - Local Business Data",
    template: "%s · BizScrape",
  },
  description:
    "Web interface for BizScrape: discover local businesses, enrich public website data, and export structured CSV.",
  applicationName: "BizScrape",
  keywords: [
    "BizScrape",
    "local business discovery",
    "data enrichment",
    "CSV export",
    "Python",
    "Next.js",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "BizScrape",
    title: "BizScrape - Local Business Data",
    description:
      "Web interface for BizScrape: discover local businesses, enrich public website data, and export structured CSV.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BizScrape - Local Business Data",
    description:
      "Web interface for BizScrape: discover local businesses, enrich public website data, and export structured CSV.",
  },
  icons: {
    icon: [{ url: "/favicon.ico" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0D0C",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sansFont.variable} ${monoFont.variable}`}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
