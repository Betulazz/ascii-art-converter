import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImageExportActions } from "./ImageExportActions";
import { encodeAsciiPng } from "../lib/asciiImage";
import { choosePngExportPath, exportAsciiPng } from "../lib/tauri";

vi.mock("../lib/asciiImage", () => ({
  encodeAsciiPng: vi.fn(),
}));

vi.mock("../lib/tauri", () => ({
  choosePngExportPath: vi.fn(),
  exportAsciiPng: vi.fn(),
}));

describe("ImageExportActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("encodes and exports an ASCII PNG", async () => {
    vi.mocked(encodeAsciiPng).mockResolvedValue(new Uint8Array([137, 80, 78, 71]));
    vi.mocked(choosePngExportPath).mockResolvedValue("C:/tmp/sample-ascii.png");
    vi.mocked(exportAsciiPng).mockResolvedValue("C:/tmp/sample-ascii.png");
    const onStatus = vi.fn();
    const result = { text: "@@", width: 2, height: 1 };

    render(<ImageExportActions result={result} fileStem="sample" onStatus={onStatus} />);
    fireEvent.click(screen.getByRole("button", { name: /PNG/i }));

    await waitFor(() => expect(encodeAsciiPng).toHaveBeenCalledWith(result));
    expect(choosePngExportPath).toHaveBeenCalledWith("sample-ascii.png");
    expect(exportAsciiPng).toHaveBeenCalledWith({ pngBytes: [137, 80, 78, 71], path: "C:/tmp/sample-ascii.png" });
    expect(onStatus).toHaveBeenCalledWith("已导出 PNG：C:/tmp/sample-ascii.png");
  });

  it("does not export when the user cancels the save dialog", async () => {
    vi.mocked(encodeAsciiPng).mockResolvedValue(new Uint8Array([137, 80, 78, 71]));
    vi.mocked(choosePngExportPath).mockResolvedValue(null);
    const onStatus = vi.fn();

    render(<ImageExportActions result={{ text: "@", width: 1, height: 1 }} fileStem="" onStatus={onStatus} />);
    fireEvent.click(screen.getByRole("button", { name: /PNG/i }));

    await waitFor(() => expect(choosePngExportPath).toHaveBeenCalledWith("ascii-art-ascii.png"));
    expect(exportAsciiPng).not.toHaveBeenCalled();
  });
});
