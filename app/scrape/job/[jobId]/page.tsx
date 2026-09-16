"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { JobView } from "@/components/scrape-job/job-view";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Spinner } from "@/components/ui/spinner";
import { useIsClient } from "@/hooks/use-is-client";
import { usePersistScrapeHistory } from "@/hooks/use-persist-scrape-history";
import { useScrapeJob } from "@/hooks/use-scrape-job";
import { useScrapeResults } from "@/hooks/use-scrape-results";
import { SCRAPE_PATH } from "@/lib/constants";

export default function ScrapeJobPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const isClient = useIsClient();
  const job = useScrapeJob(jobId);
  const results = useScrapeResults(jobId);
  usePersistScrapeHistory(job, results);

  if (!isClient) {
    return (
      <Container size="wide" className="py-16">
        <Spinner label="Loading job…" />
      </Container>
    );
  }

  if (!job) {
    return (
      <Container className="py-16 sm:py-20">
        <p className="font-mono text-sm tracking-wide text-muted uppercase">
          Job
        </p>
        <h1 className="text-page-heading mt-2">Job not found</h1>
        <p className="mt-3 max-w-lg text-small">
          No job snapshot is available for this ID yet. If the Python API is
          running, wait a moment or open the job from a fresh scrape. Otherwise
          configure a new scrape to create one.
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
      <JobView job={job} />
    </Container>
  );
}
