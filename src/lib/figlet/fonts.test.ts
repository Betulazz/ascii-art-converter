import { describe, expect, it } from "vitest";
import { FIGLET_FONT_NAMES } from "./fonts";

describe("FIGLET_FONT_NAMES", () => {
  it("includes the broad TAAG/figlet.js font collection", () => {
    expect(FIGLET_FONT_NAMES.length).toBeGreaterThan(250);
    expect(FIGLET_FONT_NAMES).toContain("Standard");
    expect(FIGLET_FONT_NAMES).toContain("Graffiti");
    expect(FIGLET_FONT_NAMES).toContain("ANSI Shadow");
    expect(FIGLET_FONT_NAMES).toContain("3-D");
  });
});
