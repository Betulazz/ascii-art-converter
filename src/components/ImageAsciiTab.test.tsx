import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImageAsciiTab, buildGifExportText } from "./ImageAsciiTab";
import { convertGifToAscii, convertImageToAscii, exportAsciiConsole } from "../lib/tauri";

vi.mock("../lib/tauri", () => ({
  chooseTxtExportPath: vi.fn(),
  convertGifToAscii: vi.fn(),
  convertImageToAscii: vi.fn(),
  exportAsciiConsole: vi.fn(),
  exportAsciiTxt: vi.fn(),
}));

describe("ImageAsciiTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the empty preview placeholder as readable Chinese text", () => {
    render(<ImageAsciiTab />);

    expect(screen.getByText("选择图片并生成后，字符画会显示在这里。")).not.toBeNull();
    expect(screen.queryByText(/\\u9009/)).toBeNull();
  });

  it("routes gif files to the gif conversion command", async () => {
    vi.mocked(convertGifToAscii).mockResolvedValue({
      frames: [{ text: "@", width: 1, height: 1, delayMs: 50 }],
      width: 1,
      height: 1,
      frameCount: 1,
      totalDurationMs: 50,
    });
    vi.mocked(convertImageToAscii).mockResolvedValue({ text: "@", width: 1, height: 1 });

    const { container } = render(<ImageAsciiTab />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const convertButton = container.querySelector("button.primary-button") as HTMLButtonElement;
    const file = new File([new Uint8Array([1, 2, 3])], "animation.gif", { type: "image/gif" });

    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(convertButton);

    await waitFor(() => expect(convertGifToAscii).toHaveBeenCalledOnce());
    expect(convertImageToAscii).not.toHaveBeenCalled();
  });

  it("formats gif frames for text export", () => {
    const text = buildGifExportText({
      frames: [
        { text: "AA", width: 2, height: 1, delayMs: 50 },
        { text: "BB", width: 2, height: 1, delayMs: 80 },
      ],
      width: 2,
      height: 1,
      frameCount: 2,
      totalDurationMs: 130,
    });

    expect(text).toContain("Frame 1 / 2 (50 ms)");
    expect(text).toContain("AA");
    expect(text).toContain("Frame 2 / 2 (80 ms)");
    expect(text).toContain("BB");
  });

  it("opens gif ascii frames in a cmd console window", async () => {
    vi.mocked(convertGifToAscii).mockResolvedValue({
      frames: [
        { text: "AA", width: 2, height: 1, delayMs: 50 },
        { text: "BB", width: 2, height: 1, delayMs: 80 },
      ],
      width: 2,
      height: 1,
      frameCount: 2,
      totalDurationMs: 130,
    });
    vi.mocked(exportAsciiConsole).mockResolvedValue("Opened CMD console.");

    const { container } = render(<ImageAsciiTab />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const convertButton = container.querySelector("button.primary-button") as HTMLButtonElement;
    const file = new File([new Uint8Array([1, 2, 3])], "animation.gif", { type: "image/gif" });

    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(convertButton);
    await waitFor(() => expect(convertGifToAscii).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByRole("button", { name: /CMD/i }));

    await waitFor(() =>
      expect(exportAsciiConsole).toHaveBeenCalledWith({
        title: "animation",
        scaleMode: "auto",
        frames: [
          { text: "AA", width: 2, height: 1, delayMs: 50 },
          { text: "BB", width: 2, height: 1, delayMs: 80 },
        ],
      }),
    );
  });

  it("passes colored gif cells to the cmd console command", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 7 })),
      font: "",
      fillStyle: "",
      textBaseline: "",
    } as unknown as CanvasRenderingContext2D);
    vi.mocked(convertGifToAscii).mockResolvedValue({
      frames: [
        {
          text: "@.",
          width: 2,
          height: 1,
          delayMs: 50,
          coloredCells: [
            { char: "@", foreground: "#ff0000" },
            { char: ".", foreground: "#00ff00" },
          ],
        },
      ],
      width: 2,
      height: 1,
      frameCount: 1,
      totalDurationMs: 50,
    });
    vi.mocked(exportAsciiConsole).mockResolvedValue("Opened CMD console.");

    const { container } = render(<ImageAsciiTab />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const convertButton = container.querySelector("button.primary-button") as HTMLButtonElement;
    const file = new File([new Uint8Array([1, 2, 3])], "color.gif", { type: "image/gif" });

    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(convertButton);
    await waitFor(() => expect(convertGifToAscii).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole("button", { name: /CMD/i }));

    await waitFor(() =>
      expect(exportAsciiConsole).toHaveBeenCalledWith({
        title: "color",
        scaleMode: "auto",
        frames: [
          {
            text: "@.",
            width: 2,
            height: 1,
            delayMs: 50,
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
