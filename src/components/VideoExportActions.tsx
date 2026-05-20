import { useState } from "react";
import { Film } from "lucide-react";
import { encodeAsciiVideoFrames } from "../lib/asciiVideo";
import { chooseVideoExportPath, exportAsciiVideo } from "../lib/tauri";
import type { VideoAsciiResult } from "../types/ascii";

type VideoExportActionsProps = {
  result: VideoAsciiResult;
  fileStem: string;
  onStatus: (message: string) => void;
};

export function VideoExportActions({ result, fileStem, onStatus }: VideoExportActionsProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportVideo() {
    setIsExporting(true);
    onStatus("正在编码 MP4...");

    try {
      const framePngBytes = await encodeAsciiVideoFrames(result);
      const path = await chooseVideoExportPath(`${fileStem || "ascii-art"}-ascii.mp4`);
      if (!path) {
        return;
      }

      const writtenPath = await exportAsciiVideo({
        framePngBytes: framePngBytes.map((frame) => Array.from(frame)),
        fps: result.sourceFps,
        path,
      });
      onStatus(`已导出 MP4：${writtenPath}`);
    } catch (error) {
      onStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button className="primary-button" type="button" onClick={handleExportVideo} disabled={isExporting || !result.frames.length}>
      <Film size={17} />
      {isExporting ? "导出中" : "导出 MP4"}
    </button>
  );
}
