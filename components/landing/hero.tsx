"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { HeroPipeline } from "@/components/landing/hero-pipeline";
import { IconGithub } from "@/components/icons";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TAGLINE,
  GITHUB_URL,
  SCRAPE_PATH,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const FADE_UP_ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const } },
};

export function LandingHero() {
  return (
    <section className="border-b border-border bg-background overflow-hidden">
      <Container
        size="wide"
        className="grid items-center gap-10 py-16 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-12 lg:py-24"
      >
        <motion.div 
          className="hero-copy max-w-lg pt-1 lg:pt-3"
          initial="hidden"
          animate="show"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
        >
          <motion.div variants={FADE_UP_ANIMATION_VARIANTS}>
            <p className="font-mono text-xs tracking-wider text-primary uppercase bg-primary/10 inline-block px-3 py-1 rounded-full border border-primary/20">
              {APP_NAME} · local business data
            </p>
          </motion.div>
          <motion.h1 
            className="text-5xl lg:text-6xl font-bold tracking-tight mt-6 text-foreground"
            variants={FADE_UP_ANIMATION_VARIANTS}
          >
            Extract structured business data effortlessly.
          </motion.h1>
          <motion.p 
            className="mt-6 text-lg font-medium text-foreground/80 leading-relaxed"
            variants={FADE_UP_ANIMATION_VARIANTS}
          >
            {APP_TAGLINE}
          </motion.p>
          <motion.p 
            className="mt-3 text-base text-muted-foreground/80"
            variants={FADE_UP_ANIMATION_VARIANTS}
          >
            {APP_DESCRIPTION.replace(/\.$/, "")} through a Python pipeline -
            discovery, website enrichment, then CSV.
          </motion.p>

          <motion.div 
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
            variants={FADE_UP_ANIMATION_VARIANTS}
          >
            <Link
              href={SCRAPE_PATH}
              className={cn(buttonClassName({ size: "lg" }), "w-full sm:w-auto shadow-lg shadow-primary/20")}
            >
              Start scrape
            </Link>
            <a
              href="#how-it-works"
              className={cn(
                buttonClassName({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto",
              )}
            >
              See the pipeline
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View BizScrape on GitHub, opens in a new tab"
              className={cn(
                buttonClassName({ variant: "ghost", size: "lg" }),
                "w-full gap-2 sm:w-auto text-muted-foreground hover:text-foreground",
              )}
            >
              <IconGithub size={18} />
              GitHub
            </a>
          </motion.div>

          <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="mt-8 pt-6 border-t border-border-subtle flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">
              niche + location → discover → enrich → CSV
            </p>
            <a href="https://github.com/mayurnakum07" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              Created by @mayurnakum07
            </a>
          </motion.div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.5, delay: 0.3 }}
        >
          <HeroPipeline />
        </motion.div>
      </Container>
    </section>
  );
}
