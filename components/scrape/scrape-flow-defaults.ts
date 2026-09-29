import type { ScrapeConfig } from "@/types/scrape";
import { DEFAULT_SCRAPE_CONFIG, TARGET_DEFAULT } from "@/lib/scrape/constants";

/**
 * Compact modal defaults - speeds the common path without changing validation.
 */
export const SCRAPE_FLOW_DEFAULTS: ScrapeConfig = {
  ...DEFAULT_SCRAPE_CONFIG,
  businessType: "",
  country: "USA",
  state: "",
  city: "",
  area: "",
  target: TARGET_DEFAULT,
  sources: ["gmaps"],
  searchAllLocalities: false,
};
