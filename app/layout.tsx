import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

import { AppShell } from "@/components/layout/app-shell";
import { getSiteUrl } from "@/lib/env";

import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "BizScrape — Local Business Data",
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
    title: "BizScrape — Local Business Data",
    description:
      "Web interface for BizScrape: discover local businesses, enrich public website data, and export structured CSV.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BizScrape — Local Business Data",
    description:
      "Web interface for BizScrape: discover local businesses, enrich public website data, and export structured CSV.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0d10",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
