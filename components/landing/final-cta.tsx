"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { IconGithub } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { GITHUB_URL, SCRAPE_PATH } from "@/lib/constants";

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="border-b border-border bg-card/10 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
      <Container size="wide" className="py-20 sm:py-28 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between sm:gap-12"
        >
          <div className="max-w-2xl">
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10 uppercase tracking-wider mb-4">
              Next step
            </Badge>
            <h2 id="final-cta-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Give BizScrape a business category and a location.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Configure a job in the scrape workspace and follow live progress
              through to CSV export.
            </p>
          </div>
          
          <div className="flex shrink-0 flex-wrap items-center gap-4">
            <Button size="lg" className="shadow-lg shadow-primary/20 hover:scale-105 transition-transform" asChild>
              <Link href={SCRAPE_PATH}>Start scrape</Link>
            </Button>
            <Button variant="outline" size="lg" className="gap-2 bg-background/50 hover:bg-background/80" asChild>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View BizScrape on GitHub, opens in a new tab"
              >
                <IconGithub size={18} />
                GitHub
              </a>
            </Button>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
