"use client";

import { useRouter } from "next/navigation";

import { ScrapeFlowModalGate } from "@/components/scrape/scrape-flow-modal";
import { Container } from "@/components/ui/container";

export function ScrapePageClient() {
  const router = useRouter();

  return (
    <>
      <Container size="wide" className="py-10 sm:py-14">
        <div className="mx-auto max-w-lg text-center">
          <p className="font-mono text-xs tracking-wide text-primary uppercase">
            Workspace
          </p>
          <h1 className="text-page-heading mt-2">Scrape query</h1>
          <p className="mt-2 text-small">
            Configure a job in the scrape panel. Finished result sets are saved
            in this browser under History.
          </p>
        </div>
      </Container>

      <ScrapeFlowModalGate open onClose={() => router.push("/")} />
    </>
  );
}
