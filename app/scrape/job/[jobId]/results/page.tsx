"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ResultsView } from "@/components/results/results-view";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Spinner } from "@/components/ui/spinner";
import { useIsClient } from "@/hooks/use-is-client";
import { usePersistScrapeHistory } from "@/hooks/use-persist-scrape-history";
import { useScrapeJob } from "@/hooks/use-scrape-job";
import { useScrapeResults } from "@/hooks/use-scrape-results";
import { SCRAPE_PATH } from "@/lib/constants";

export default function ScrapeResultsPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const isClient = useIsClient();
  const job = useScrapeJob(jobId);
  const results = useScrapeResults(jobId);
  usePersistScrapeHistory(job, results);

  if (!isClient) {
    return (
      <Container size="wide" className="py-16">
        <Spinner label="Loading results…" />
      </Container>
    );
  }

  if (!job) {
    return (
      <Container className="py-16 sm:py-20">
        <p className="font-mono text-sm tracking-wide text-muted uppercase">
          Results
        </p>
        <h1 className="text-page-heading mt-2">Job not found</h1>
        <p className="mt-3 max-w-lg text-small">
          Results are tied to a job ID in this browser session. Configure a new
          scrape to generate a result set.
        </p>
        <Link
          href={SCRAPE_PATH}
          className={buttonClassName({ className: "mt-6" })}
        >
          Configure a scrape
        </Link>
      </Container>
    );
  }

  return (
    <Container size="wide" className="py-10 sm:py-14">
      <ResultsView job={job} results={results} />
    </Container>
  );
}
