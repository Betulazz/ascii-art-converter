import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AsciiPreview } from "./AsciiPreview";

describe("AsciiPreview", () => {
  it("uses the same character width for color and text previews", () => {
    const { container } = render(
      <AsciiPreview
        placeholder="empty"
        result={{
          text: "AB\nCD",
          width: 2,
          height: 2,
          coloredCells: [
            { char: "A", foreground: "#ffffff" },
            { char: "B", foreground: "#ffffff" },
            { char: "C", foreground: "#ffffff" },
            { char: "D", foreground: "#ffffff" },
          ],
        }}
      />,
    );

    expect(container.querySelector(".color-preview")?.getAttribute("style")).toContain(
      "grid-template-columns: repeat(2, 1ch)",
    );
  });
});
