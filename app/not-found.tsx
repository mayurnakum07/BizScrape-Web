import Link from "next/link";

import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFoundPage() {
  return (
    <Container className="flex flex-col justify-center py-16 sm:py-24">
      <p className="font-mono text-sm tracking-wide text-muted uppercase">
        404
      </p>
      <h1 className="text-page-heading mt-3">Page not found</h1>
      <p className="mt-4 max-w-lg text-small">
        The page you requested does not exist or has been moved.
      </p>
      <div className="mt-6">
        <Link href="/" className={buttonClassName()}>
          Back to home
        </Link>
      </div>
    </Container>
  );
}
