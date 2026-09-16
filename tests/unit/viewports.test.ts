import { describe, expect, it } from "vitest";

import { BREAKPOINTS, matchesMinWidth } from "@/lib/responsive";

const REQUIRED_WIDTHS = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920];

describe("responsive regression breakpoints", () => {
  it("covers milestone viewport widths against Tailwind breakpoints", () => {
    for (const width of REQUIRED_WIDTHS) {
      if (width >= BREAKPOINTS.md) {
        expect(matchesMinWidth(width, "md")).toBe(true);
      } else {
        expect(matchesMinWidth(width, "md")).toBe(false);
      }
    }
  });
});
