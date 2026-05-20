import { beforeEach, describe, expect, it, vi } from "vitest";
import { convertGifToAscii, exportAsciiGif, exportAsciiPng } from "./tauri";
import { invoke } from "@tauri-apps/api/core";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: vi.fn(),
}));

describe("tauri api wrappers", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
  });

  it("reports a clear error when the page is not running inside Tauri", async () => {
    vi.mocked(invoke).mockRejectedValue(new TypeError("Cannot read properties of undefined (reading 'invoke')"));

    await expect(
      convertGifToAscii({
        imageBytes: [1, 2, 3],
        fileName: "sample.gif",
        outputWidth: 80,
        charset: "@.",
        invert: false,
        preserveAspectRatio: true,
        colorPreview: false,
      }),
    ).rejects.toThrow("Please run this converter in the Tauri desktop app");
  });

  it("exports ascii gif bytes through the gif command", async () => {
    vi.mocked(invoke).mockResolvedValue("C:/tmp/ascii.gif");

    await expect(exportAsciiGif({ gifBytes: [71, 73, 70], path: "C:/tmp/ascii.gif" })).resolves.toBe(
      "C:/tmp/ascii.gif",
    );

    expect(invoke).toHaveBeenCalledWith("export_ascii_gif", {
      input: { gifBytes: [71, 73, 70], path: "C:/tmp/ascii.gif" },
    });
  });

  it("exports ascii png bytes through the png command", async () => {
    vi.mocked(invoke).mockResolvedValue("C:/tmp/ascii.png");

    await expect(exportAsciiPng({ pngBytes: [137, 80, 78, 71], path: "C:/tmp/ascii.png" })).resolves.toBe(
      "C:/tmp/ascii.png",
    );

    expect(invoke).toHaveBeenCalledWith("export_ascii_png", {
      input: { pngBytes: [137, 80, 78, 71], path: "C:/tmp/ascii.png" },
    });
  });
});
