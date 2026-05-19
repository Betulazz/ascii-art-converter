import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ImageAsciiTab, buildGifExportText } from "./ImageAsciiTab";
import { convertGifToAscii, convertImageToAscii } from "../lib/tauri";

vi.mock("../lib/tauri", () => ({
  chooseTxtExportPath: vi.fn(),
  convertGifToAscii: vi.fn(),
  convertImageToAscii: vi.fn(),
  exportAsciiTxt: vi.fn(),
}));

describe("ImageAsciiTab", () => {
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
});
