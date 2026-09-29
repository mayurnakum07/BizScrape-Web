"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const stages = [
  {
    id: "01",
    title: "Discover",
    body: "Find businesses from configured local sources such as Google Maps, with locality filtering.",
  },
  {
    id: "02",
    title: "Resolve",
    body: "Fill missing website URLs using web search when a listing does not already include one.",
  },
  {
    id: "03",
    title: "Enrich",
    body: "Visit public business websites and extract available contact and social information.",
  },
  {
    id: "04",
    title: "Export",
    body: "Normalize, deduplicate, and write structured results to an Excel-friendly CSV.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-b border-border bg-background">
      <Container size="wide" className="py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-wider">
              Pipeline
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight mt-4 text-foreground">
              Scrape → process → dataset
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              The web UI drives the same stages as the Python CLI. Scraping
              stays in the robust engine - this product does not reimplement it in
              the browser.
            </p>
            <p className="mt-6 font-mono text-sm text-primary/80 bg-primary/5 inline-block px-3 py-1.5 rounded-md border border-primary/10">
              Business + location → discovery → resolution → enrichment → dedupe → CSV
            </p>
          </motion.div>

          <motion.div 
            className="flex flex-col gap-4"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            {stages.map((stage, index) => (
              <motion.div
                key={stage.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                <Card className="border-border bg-card/50 shadow-md hover:bg-card/80 hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-5 flex flex-col sm:flex-row items-baseline gap-4 sm:gap-6">
                    <span className="font-mono text-xl font-bold text-primary tabular-nums opacity-80 shrink-0">
                      {stage.id}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {stage.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {stage.body}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
