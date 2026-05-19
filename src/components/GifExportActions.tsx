import { useState } from "react";
import { Film } from "lucide-react";
import { encodeAsciiGif } from "../lib/asciiGif";
import { chooseGifExportPath, exportAsciiGif } from "../lib/tauri";
import type { GifAsciiResult } from "../types/ascii";

type GifExportActionsProps = {
  result: GifAsciiResult;
  fileStem: string;
  onStatus: (message: string) => void;
};

export function GifExportActions({ result, fileStem, onStatus }: GifExportActionsProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportGif() {
    setIsExporting(true);
    onStatus("\u6b63\u5728\u7f16\u7801 GIF...");

    try {
      const gifBytes = await encodeAsciiGif(result);
      const path = await chooseGifExportPath(`${fileStem || "ascii-art"}-ascii.gif`);
      if (!path) {
        return;
      }

      const writtenPath = await exportAsciiGif({ gifBytes: Array.from(gifBytes), path });
      onStatus(`\u5df2\u5bfc\u51fa GIF\uff1a${writtenPath}`);
    } catch (error) {
      onStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button className="primary-button" type="button" onClick={handleExportGif} disabled={isExporting || !result.frames.length}>
      <Film size={17} />
      {isExporting ? "\u5bfc\u51fa\u4e2d" : "\u5bfc\u51fa GIF"}
    </button>
  );
}
