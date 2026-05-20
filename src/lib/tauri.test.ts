import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  chooseVideoOpenPath,
  convertGifToAscii,
  convertVideoToAscii,
  exportAsciiConsole,
  exportAsciiGif,
  exportAsciiPng,
  exportAsciiVideo,
} from "./tauri";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
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

  it("opens ascii art through the console command", async () => {
    vi.mocked(invoke).mockResolvedValue("Opened CMD console.");

    await expect(exportAsciiConsole({ title: "sample", text: "@@" })).resolves.toBe("Opened CMD console.");

    expect(invoke).toHaveBeenCalledWith("export_ascii_console", {
      input: { title: "sample", text: "@@" },
    });
  });

  it("opens a video picker with supported video extensions", async () => {
    vi.mocked(open).mockResolvedValue("C:/tmp/source.mp4");

    await expect(chooseVideoOpenPath()).resolves.toBe("C:/tmp/source.mp4");

    expect(open).toHaveBeenCalledWith({
      multiple: false,
      filters: [{ name: "Video", extensions: ["mp4", "webm", "mov", "avi", "mkv"] }],
    });
  });

  it("converts video files through the video command", async () => {
    vi.mocked(invoke).mockResolvedValue({ frames: [], width: 0, height: 0, frameCount: 0, totalDurationMs: 0 });

    await convertVideoToAscii({
      path: "C:/tmp/source.mp4",
      fileName: "source.mp4",
      outputWidth: 80,
      charset: "@.",
      invert: false,
      preserveAspectRatio: true,
      colorPreview: true,
      targetFps: 12,
    });

    expect(invoke).toHaveBeenCalledWith("convert_video_to_ascii", {
      input: {
        path: "C:/tmp/source.mp4",
        fileName: "source.mp4",
        outputWidth: 80,
        charset: "@.",
        invert: false,
        preserveAspectRatio: true,
        colorPreview: true,
        targetFps: 12,
      },
    });
  });

  it("exports ascii video frames through the video command", async () => {
    vi.mocked(invoke).mockResolvedValue("C:/tmp/ascii.mp4");

    await expect(
      exportAsciiVideo({
        framePngBytes: [[137, 80, 78, 71]],
        fps: 12,
        path: "C:/tmp/ascii.mp4",
      }),
    ).resolves.toBe("C:/tmp/ascii.mp4");

    expect(invoke).toHaveBeenCalledWith("export_ascii_video", {
      input: { framePngBytes: [[137, 80, 78, 71]], fps: 12, path: "C:/tmp/ascii.mp4" },
    });
  });
});
