"use client";

import { motion } from "framer-motion";
import { IconGithub } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GITHUB_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

const points = [
  "Inspect the Python pipeline and selectors",
  "Run the CLI locally with your own queries",
  "Modify enrichment or export behavior",
  "Suggest improvements or new sources",
] as const;

export function OpenSourceSection() {
  return (
    <section
      id="open-source"
      className="scroll-mt-20 border-b border-border bg-background"
      aria-labelledby="open-source-heading"
    >
      <Container size="wide" className="py-16 sm:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-wider mb-4">
              Open source
            </Badge>
            <h2 id="open-source-heading" className="text-3xl font-bold tracking-tight text-foreground">
              Built in the open
            </h2>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground leading-relaxed">
              BizScrape is MIT-licensed tooling. The scraping engine lives in
              the public Python repository - you can read it, run it, and change
              it. This web app is the interface layer; it does not hide a closed
              scraper.
            </p>
            <Button
              variant="outline"
              size="lg"
              className="mt-8 gap-2 shadow-sm"
              asChild
            >
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View BizScrape source on GitHub, opens in a new tab"
              >
                <IconGithub size={18} />
                View source on GitHub
              </a>
            </Button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-card/40 border-border shadow-md overflow-hidden">
              <div className="border-b border-border bg-muted/20 px-5 py-3">
                <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                  Community
                </p>
              </div>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {points.map((point) => (
                    <li
                      key={point}
                      className="flex items-center gap-4 px-5 py-4 text-sm text-foreground hover:bg-muted/10 transition-colors"
                    >
                      <span
                        className="size-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px_rgba(200,240,74,0.6)]"
                        aria-hidden="true"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="border-t border-border bg-muted/20 px-5 py-3">
                <p className="font-mono text-xs text-muted-foreground">
                  Stack: Python · CLI · Playwright · HTTP · CSV
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
