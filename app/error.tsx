"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
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
      <p className="font-mono text-sm tracking-wide text-error uppercase">
        Error
      </p>
      <h1 className="text-page-heading mt-3">Something went wrong</h1>
      <p className="mt-4 max-w-lg text-small">
        An unexpected error occurred. You can try again, or return later if the
        problem persists.
      </p>
      <div className="mt-6">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      </div>
    </Container>
  );
}
