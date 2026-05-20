import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { encodeAsciiPng } from "./asciiImage";

type FillTextCall = {
  text: string;
  x: number;
  y: number;
  fillStyle: string;
};

describe("encodeAsciiPng", () => {
  let originalCreateElement: typeof document.createElement;
  const fillTextCalls: FillTextCall[] = [];
  const fillRect = vi.fn();
  const measureText = vi.fn((text: string) => ({ width: text.length * 7 }));

  beforeEach(() => {
    fillTextCalls.length = 0;
    fillRect.mockClear();
    measureText.mockClear();
    originalCreateElement = document.createElement.bind(document);

    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName !== "canvas") {
        return originalCreateElement(tagName);
      }

      const context = {
        font: "",
        fillStyle: "",
        textBaseline: "",
        measureText,
        fillRect,
        fillText(text: string, x: number, y: number) {
          fillTextCalls.push({ text, x, y, fillStyle: this.fillStyle });
        },
      };

      return {
        width: 0,
        height: 0,
        getContext: vi.fn(() => context),
        toBlob: vi.fn((callback: BlobCallback, type?: string) => {
          callback(new Blob([new Uint8Array([137, 80, 78, 71])], { type }));
        }),
      } as unknown as HTMLCanvasElement;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects empty ascii art", async () => {
    await expect(encodeAsciiPng({ text: "", width: 0, height: 0 })).rejects.toThrow(
      "Cannot export empty ASCII art as PNG.",
    );
  });

  it("draws plain ascii text onto a png canvas", async () => {
    const pngBytes = await encodeAsciiPng({ text: "@@\n..", width: 2, height: 2 });

    expect(Array.from(pngBytes)).toEqual([137, 80, 78, 71]);
    expect(fillRect).toHaveBeenCalledWith(0, 0, 14, 22);
    expect(fillTextCalls).toEqual([
      { text: "@@", x: 0, y: 0, fillStyle: "#e9f5ef" },
      { text: "..", x: 0, y: 11, fillStyle: "#e9f5ef" },
    ]);
  });

  it("draws colored cells with each cell foreground color", async () => {
    await encodeAsciiPng({
      text: "@.",
      width: 2,
      height: 1,
      coloredCells: [
        { char: "@", foreground: "#ffffff" },
        { char: ".", foreground: "#44aa88" },
      ],
    });

    expect(fillTextCalls).toEqual([
      { text: "@", x: 0, y: 0, fillStyle: "#ffffff" },
      { text: ".", x: 7, y: 0, fillStyle: "#44aa88" },
    ]);
  });
});
