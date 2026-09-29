import Link from "next/link";

import { WorkflowStatePanel } from "@/components/workflow/workflow-state-panel";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SCRAPE_PATH } from "@/lib/constants";

export default function NotFoundPage() {
  return (
    <Container className="flex flex-col justify-center py-16 sm:py-24">
      <WorkflowStatePanel
        kind="not_found"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/" className={buttonClassName()}>
              Back to home
            </Link>
            <Link
              href={SCRAPE_PATH}
              className={buttonClassName({ variant: "outline" })}
            >
              Start a scrape
            </Link>
          </div>
        }
      />
    </Container>
  );
}
