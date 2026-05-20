import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExportActions } from "./ExportActions";
import { exportAsciiConsole } from "../lib/tauri";

vi.mock("../lib/tauri", () => ({
  chooseTxtExportPath: vi.fn(),
  exportAsciiConsole: vi.fn(),
  exportAsciiTxt: vi.fn(),
}));

describe("ExportActions", () => {
  it("copies ascii text to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const onStatus = vi.fn();

    render(<ExportActions text={"ASCII\nART"} fileStem="ascii-art" onStatus={onStatus} />);
    fireEvent.click(screen.getByRole("button", { name: /复制/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("ASCII\nART"));
    expect(onStatus).toHaveBeenCalledWith("已复制到剪贴板。");
  });
  it("opens ascii text in a cmd console window", async () => {
    vi.mocked(exportAsciiConsole).mockResolvedValue("Opened CMD console.");
    const onStatus = vi.fn();

    render(<ExportActions text={"ASCII\nART"} fileStem="sample" onStatus={onStatus} />);
    fireEvent.click(screen.getByRole("button", { name: /CMD/i }));

    await waitFor(() =>
      expect(exportAsciiConsole).toHaveBeenCalledWith({
        title: "sample",
        text: "ASCII\nART",
      }),
    );
    expect(onStatus).toHaveBeenCalledWith("Opened CMD console.");
  });

  it("disables the cmd console button when there is no ascii text", () => {
    render(<ExportActions text="" fileStem="sample" onStatus={vi.fn()} />);

    expect((screen.getByRole("button", { name: /CMD/i }) as HTMLButtonElement).disabled).toBe(true);
  });
});
