import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VideoAsciiTab } from "./VideoAsciiTab";
import { chooseVideoExportPath, chooseVideoOpenPath, convertVideoToAscii, exportAsciiConsole, exportAsciiVideo } from "../lib/tauri";

vi.mock("../lib/tauri", () => ({
  chooseTxtExportPath: vi.fn(),
  chooseVideoExportPath: vi.fn(),
  chooseVideoOpenPath: vi.fn(),
  convertVideoToAscii: vi.fn(),
  exportAsciiConsole: vi.fn(),
  exportAsciiTxt: vi.fn(),
  exportAsciiVideo: vi.fn(),
}));

vi.mock("../lib/asciiVideo", () => ({
  encodeAsciiVideoFrames: vi.fn(async () => [new Uint8Array([137, 80, 78, 71])]),
}));

describe("VideoAsciiTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("selects a video path and converts it to ascii frames", async () => {
    vi.mocked(chooseVideoOpenPath).mockResolvedValue("C:/tmp/source.mp4");
    vi.mocked(convertVideoToAscii).mockResolvedValue({
      frames: [{ text: "@@", width: 2, height: 1, delayMs: 83 }],
      width: 2,
      height: 1,
      frameCount: 1,
      totalDurationMs: 83,
      sourceFps: 8,
    });

    render(<VideoAsciiTab />);
    fireEvent.click(screen.getByRole("button", { name: /选择视频/ }));
    await screen.findByText("source.mp4");
    fireEvent.click(screen.getByRole("button", { name: /生成字符画/ }));

    await waitFor(() =>
      expect(convertVideoToAscii).toHaveBeenCalledWith({
        path: "C:/tmp/source.mp4",
        fileName: "source.mp4",
        outputWidth: 120,
        charset: "@%#*+=-:. ",
        invert: false,
        preserveAspectRatio: true,
        colorPreview: false,
        targetFps: 8,
      }),
    );
  });

  it("exports converted ascii frames as mp4", async () => {
    vi.mocked(chooseVideoExportPath).mockResolvedValue("C:/tmp/source-ascii.mp4");
    vi.mocked(convertVideoToAscii).mockResolvedValue({
      frames: [{ text: "@@", width: 2, height: 1, delayMs: 83 }],
      width: 2,
      height: 1,
      frameCount: 1,
      totalDurationMs: 83,
      sourceFps: 8,
    });
    vi.mocked(exportAsciiVideo).mockResolvedValue("C:/tmp/source-ascii.mp4");

    render(<VideoAsciiTab />);
    vi.mocked(chooseVideoOpenPath).mockResolvedValue("C:/tmp/source.mp4");
    fireEvent.click(screen.getByRole("button", { name: /选择视频/ }));
    await screen.findByText("source.mp4");
    fireEvent.click(screen.getByRole("button", { name: /生成字符画/ }));
    await waitFor(() => expect(convertVideoToAscii).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole("button", { name: /导出 MP4/ }));

    await waitFor(() =>
      expect(exportAsciiVideo).toHaveBeenCalledWith({
        framePngBytes: [[137, 80, 78, 71]],
        fps: 8,
        path: "C:/tmp/source-ascii.mp4",
      }),
    );
  });

  it("opens converted video frames in cmd", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 7 })),
      font: "",
      fillStyle: "",
      textBaseline: "",
    } as unknown as CanvasRenderingContext2D);
    vi.mocked(chooseVideoOpenPath).mockResolvedValue("C:/tmp/source.mp4");
    vi.mocked(convertVideoToAscii).mockResolvedValue({
      frames: [
        {
          text: "@.",
          width: 2,
          height: 1,
          delayMs: 83,
          coloredCells: [
            { char: "@", foreground: "#ff0000" },
            { char: ".", foreground: "#00ff00" },
          ],
        },
      ],
      width: 2,
      height: 1,
      frameCount: 1,
      totalDurationMs: 83,
      sourceFps: 8,
    });
    vi.mocked(exportAsciiConsole).mockResolvedValue("Opened CMD console.");

    render(<VideoAsciiTab />);
    fireEvent.click(screen.getByRole("button", { name: /选择视频/ }));
    await screen.findByText("source.mp4");
    fireEvent.click(screen.getByRole("button", { name: /生成字符画/ }));
    await waitFor(() => expect(convertVideoToAscii).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole("button", { name: /CMD/i }));

    await waitFor(() =>
      expect(exportAsciiConsole).toHaveBeenCalledWith({
        title: "source",
        scaleMode: "auto",
        frames: [
          {
            text: "@.",
            width: 2,
            height: 1,
            delayMs: 83,
            coloredCells: [
              { char: "@", foreground: "#ff0000" },
              { char: ".", foreground: "#00ff00" },
            ],
          },
        ],
      }),
    );
  });
});
