"use client";

import { useEffect } from "react";
import Link from "next/link";

import { WorkflowStatePanel } from "@/components/workflow/workflow-state-panel";
import { Button, buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col justify-center py-16 sm:py-24">
      <WorkflowStatePanel
        kind="app_error"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={reset}>
              Try again
            </Button>
            <Link href="/" className={buttonClassName({ variant: "outline" })}>
              Back to home
            </Link>
          </div>
        }
      />
    </Container>
  );
}
