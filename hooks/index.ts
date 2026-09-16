/**
 * Client hooks.
 * Keep hooks thin; put network / job transport in `services/`.
 */

export { useScrapeJob } from "@/hooks/use-scrape-job";
export { useScrapeResults } from "@/hooks/use-scrape-results";
export { useScrapeEvents } from "@/hooks/use-scrape-events";
