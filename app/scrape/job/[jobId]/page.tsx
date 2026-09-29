"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { JobView } from "@/components/scrape-job/job-view";
import { PersistHistoryBanner } from "@/components/workflow/persist-history-banner";
import { WorkflowStatePanel } from "@/components/workflow/workflow-state-panel";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { LoadingState } from "@/components/ui/feedback-states";
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
  const { persistError, dismissPersistError } = usePersistScrapeHistory(
    job,
    results,
  );

  if (!isClient) {
    return (
      <Container size="wide" className="py-16">
        <LoadingState
          title="Loading job workspace"
          description="Attaching to the scrape job and live progress for this browser session."
        />
      </Container>
    );
  }

  if (!job) {
    return (
      <Container className="py-16 sm:py-20">
        <WorkflowStatePanel
          kind="job_not_found"
          actions={
            <div className="flex flex-wrap gap-2">
              <Link href={SCRAPE_PATH} className={buttonClassName()}>
                Start a scrape
              </Link>
              <Link
                href={`${SCRAPE_PATH}/history`}
                className={buttonClassName({ variant: "outline" })}
              >
                Open history
              </Link>
            </div>
          }
        />
      </Container>
    );
  }

  return (
    <Container size="wide" className="flex flex-col gap-4 py-6 sm:py-8">
      <PersistHistoryBanner
        error={persistError}
        onDismiss={dismissPersistError}
      />
      <JobView job={job} />
    </Container>
  );
}
