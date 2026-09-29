"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";

const capabilities = [
  "Python pipeline",
  "Google Maps discovery",
  "Website enrichment",
  "Deduplication",
  "CSV export",
  "Open source",
] as const;

export function CapabilityStrip() {
  return (
    <section aria-label="Capabilities" className="border-b border-border bg-card/5">
      <Container size="wide" className="py-4 sm:py-5">
        <motion.ul 
          className="flex flex-wrap items-center gap-x-4 gap-y-3"
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
          {capabilities.map((item, index) => (
            <motion.li 
              key={item} 
              className="flex items-center gap-4"
              variants={{
                hidden: { opacity: 0, x: -10 },
                show: { opacity: 1, x: 0 },
              }}
            >
              {index > 0 ? (
                <span className="text-muted-foreground/30 font-bold" aria-hidden="true">
                  /
                </span>
              ) : null}
              <span className="font-mono text-sm tracking-wide text-muted-foreground hover:text-primary transition-colors cursor-default">
                {item}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}
