"use client";

import { useEffect, useRef, useState } from "react";

import { JobActions } from "@/components/scrape-job/job-actions";
import { JobActivityLog } from "@/components/scrape-job/job-activity-log";
import { JobCancelledState } from "@/components/scrape-job/job-cancelled-state";
import { JobCompletionState } from "@/components/scrape-job/job-completion-state";
import { JobConnectionBanner } from "@/components/scrape-job/job-connection-banner";
import { JobFailureState } from "@/components/scrape-job/job-failure-state";
import { JobHeader } from "@/components/scrape-job/job-header";
import { JobLatestResults } from "@/components/scrape-job/job-latest-results";
import { JobPipeline } from "@/components/scrape-job/job-pipeline";
import { JobProgressPanel } from "@/components/scrape-job/job-progress-panel";
import { JobStatsPanel } from "@/components/scrape-job/job-stats-panel";
import type { ScrapeJobSnapshot } from "@/types/scrape-job";

type JobViewProps = {
  job: ScrapeJobSnapshot;
};

export function JobView({ job }: JobViewProps) {
  const lastStatusRef = useRef(job.status);
  const lastStageRef = useRef(job.currentStage);
  const lastMilestoneRef = useRef(0);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    let nextAnnouncement = "";

    if (job.status !== lastStatusRef.current) {
      nextAnnouncement =
        job.status === "queued"
          ? "Scrape queued."
          : job.status === "starting"
            ? "Scrape starting."
            : job.status === "completed"
              ? "Scraping completed."
              : job.status === "failed"
                ? "Scraping failed."
                : job.status === "cancelled"
                  ? "Scraping cancelled."
                  : job.status === "cancelling"
                    ? "Stopping scrape."
                    : "";
      lastStatusRef.current = job.status;
    }

    if (!nextAnnouncement && job.currentStage !== lastStageRef.current && job.currentStage) {
      const stageName = job.currentStage.replaceAll("_", " ");
      nextAnnouncement = `${stageName[0]?.toUpperCase() ?? ""}${stageName.slice(1)} started.`;
      lastStageRef.current = job.currentStage;
    }

    const milestone = Math.floor(job.targetProgress.collected / 25) * 25;
    if (
      !nextAnnouncement &&
      milestone >= 25 &&
      milestone !== lastMilestoneRef.current
    ) {
      nextAnnouncement = `${milestone} businesses discovered.`;
      lastMilestoneRef.current = milestone;
    }

    if (nextAnnouncement) {
      setAnnouncement(nextAnnouncement);
    }
  }, [job.currentStage, job.status, job.targetProgress.collected]);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <JobHeader job={job} />
      <JobConnectionBanner jobId={job.id} connection={job.connection} />

      {job.status === "completed" ? <JobCompletionState job={job} /> : null}
      {job.status === "failed" ? <JobFailureState job={job} /> : null}
      {job.status === "cancelled" ? <JobCancelledState job={job} /> : null}

      <div className="flex flex-col gap-6 sm:gap-8">
        <div className="order-1">
          <JobProgressPanel job={job} />
        </div>
        <div className="order-2">
          <JobPipeline job={job} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <JobStatsPanel stats={job.stats} />
        <JobActivityLog entries={job.activity} />
      </div>

      <JobLatestResults jobId={job.id} />

      <JobActions job={job} />

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
