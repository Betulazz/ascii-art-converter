import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExportActions } from "./ExportActions";

vi.mock("../lib/tauri", () => ({
  chooseTxtExportPath: vi.fn(),
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
});
