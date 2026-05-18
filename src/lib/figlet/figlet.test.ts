import { describe, expect, it } from "vitest";
import { renderFiglet } from "./figlet";
import { loadFigletFont } from "./fonts";
import { STANDARD_FLF } from "./standard";

describe("renderFiglet", () => {
  it("renders text with the bundled standard FLF font", () => {
    const output = renderFiglet("A", STANDARD_FLF);

    expect(output).toContain("    _");
    expect(output).toContain("   / \\");
    expect(output).toContain("  / _ \\");
  });

  it("preserves spaces between rendered words", () => {
    const output = renderFiglet("A A", STANDARD_FLF);

    expect(output.split("\n")[0]).toContain("         _");
  });

  it("returns an empty string for whitespace-only input", () => {
    expect(renderFiglet("   ", STANDARD_FLF)).toBe("");
  });

  it("renders TAAG TOIlet/TLF fonts such as ASCII 12", async () => {
    const ascii12 = await loadFigletFont("ASCII 12");

    const output = renderFiglet("ASCII", ascii12);

    expect(output).toContain("####");
    expect(output.split("\n").length).toBe(10);
  });
});
