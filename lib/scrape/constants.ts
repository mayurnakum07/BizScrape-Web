import type { ScrapeConfig, ScrapeSourceId } from "@/types/scrape";

/** Align with future backend hard caps. */
export const TARGET_MIN = 1;
export const TARGET_MAX = 500;
export const TARGET_DEFAULT = 20;

export const SCRAPE_SOURCES: Array<{
  id: ScrapeSourceId;
  label: string;
  description: string;
}> = [
  {
    id: "gmaps",
    label: "Google Maps",
    description: "Discover local business listings and map metadata.",
  },
];

export const DEFAULT_SCRAPE_CONFIG: ScrapeConfig = {
  businessType: "",
  country: "",
  state: "",
  city: "",
  area: "",
  target: TARGET_DEFAULT,
  sources: ["gmaps"],
  searchAllLocalities: false,
};

export const SESSION_JOB_KEY_PREFIX = "bizscrape:job:";
