import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GifExportActions } from "./GifExportActions";
import { encodeAsciiGif } from "../lib/asciiGif";
import { chooseGifExportPath, exportAsciiGif } from "../lib/tauri";

vi.mock("../lib/asciiGif", () => ({
  encodeAsciiGif: vi.fn(),
}));

vi.mock("../lib/tauri", () => ({
  chooseGifExportPath: vi.fn(),
  exportAsciiGif: vi.fn(),
}));

describe("GifExportActions", () => {
  it("encodes and exports an ASCII gif", async () => {
    vi.mocked(encodeAsciiGif).mockResolvedValue(new Uint8Array([71, 73, 70]));
    vi.mocked(chooseGifExportPath).mockResolvedValue("C:/tmp/ascii.gif");
    vi.mocked(exportAsciiGif).mockResolvedValue("C:/tmp/ascii.gif");
    const onStatus = vi.fn();

    render(
      <GifExportActions
        result={{
          frames: [{ text: "@", width: 1, height: 1, delayMs: 50 }],
          width: 1,
          height: 1,
          frameCount: 1,
          totalDurationMs: 50,
        }}
        fileStem="sample"
        onStatus={onStatus}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /GIF/i }));

    await waitFor(() => expect(encodeAsciiGif).toHaveBeenCalledOnce());
    expect(chooseGifExportPath).toHaveBeenCalledWith("sample-ascii.gif");
    expect(exportAsciiGif).toHaveBeenCalledWith({ gifBytes: [71, 73, 70], path: "C:/tmp/ascii.gif" });
    expect(onStatus).toHaveBeenCalledWith("已导出 GIF：C:/tmp/ascii.gif");
  });
});
