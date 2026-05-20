import { useState } from "react";
import { ImageDown } from "lucide-react";
import { encodeAsciiPng } from "../lib/asciiImage";
import { choosePngExportPath, exportAsciiPng } from "../lib/tauri";
import type { AsciiResult } from "../types/ascii";

type ImageExportActionsProps = {
  result: AsciiResult;
  fileStem: string;
  onStatus: (message: string) => void;
};

export function ImageExportActions({ result, fileStem, onStatus }: ImageExportActionsProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportPng() {
    setIsExporting(true);
    onStatus("正在编码 PNG...");

    try {
      const pngBytes = await encodeAsciiPng(result);
      const path = await choosePngExportPath(`${fileStem || "ascii-art"}-ascii.png`);
      if (!path) {
        return;
      }

      const writtenPath = await exportAsciiPng({ pngBytes: Array.from(pngBytes), path });
      onStatus(`已导出 PNG：${writtenPath}`);
    } catch (error) {
      onStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button className="primary-button" type="button" onClick={handleExportPng} disabled={isExporting || !result.text}>
      <ImageDown size={17} />
      {isExporting ? "导出中" : "导出 PNG"}
    </button>
  );
}
