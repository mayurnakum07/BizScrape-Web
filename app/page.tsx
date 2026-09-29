import type { Metadata } from "next";

import { CapabilityStrip } from "@/components/landing/capability-strip";
import { DataPreview } from "@/components/landing/data-preview";
import { FinalCta } from "@/components/landing/final-cta";
import { LandingHero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { OpenSourceSection } from "@/components/landing/open-source";
import { TransparencySection } from "@/components/landing/transparency";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    absolute: `${APP_NAME} - Local Business Data CLI`,
  },
  description: APP_DESCRIPTION,
  openGraph: {
    title: `${APP_NAME} - Local Business Data CLI`,
    description: APP_DESCRIPTION,
    type: "website",
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - Local Business Data CLI`,
    description: APP_DESCRIPTION,
  },
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <>
      <LandingHero />
      <CapabilityStrip />
      <HowItWorks />
      <DataPreview />
      <TransparencySection />
      <OpenSourceSection />
      <FinalCta />
    </>
  );
}
