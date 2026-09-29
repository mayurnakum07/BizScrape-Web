"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const points = [
  {
    title: "Discovery",
    body: "Listing data from configured business sources (for example Google Maps): name, address, phone, rating, and map links when available.",
  },
  {
    title: "Website enrichment",
    body: "Visits publicly reachable company sites to collect emails, phones, and social links published on those pages.",
  },
  {
    title: "Email origin",
    body: "Email addresses come from business websites - not directly from Google Maps listings.",
  },
  {
    title: "Coverage",
    body: "Results depend on what is currently published and reachable. Missing fields are normal when a site does not expose them.",
  },
] as const;

export function TransparencySection() {
  return (
    <section
      id="public-data"
      className="scroll-mt-20 border-b border-border bg-background"
      aria-labelledby="public-data-heading"
    >
      <Container size="wide" className="py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="text-muted-foreground uppercase tracking-wider mb-4 border-muted">
              Transparency
            </Badge>
            <h2 id="public-data-heading" className="text-3xl font-bold tracking-tight text-foreground">
              Where the data comes from
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              We extract and combine data from strictly public sources without relying on proprietary databases.
            </p>
          </motion.div>
          
          <motion.div
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
            <Card className="bg-card/30 border-border shadow-lg">
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {points.map((point) => (
                    <motion.li 
                      key={point.title}
                      className="p-6 hover:bg-muted/10 transition-colors"
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        show: { opacity: 1, y: 0 },
                      }}
                    >
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {point.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed pl-3.5">
                        {point.body}
                      </p>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
