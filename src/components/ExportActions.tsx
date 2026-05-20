import { useState } from "react";
import { Copy, Download, Terminal } from "lucide-react";
import { chooseTxtExportPath, exportAsciiConsole, exportAsciiTxt } from "../lib/tauri";
import type { ColoredCell, ConsoleScaleMode, ExportConsoleFrame } from "../types/ascii";

type ExportActionsProps = {
  text: string;
  fileStem: string;
  onStatus: (message: string) => void;
  consoleFrames?: ExportConsoleFrame[];
  consoleWidth?: number;
  consoleHeight?: number;
  consoleColoredCells?: ColoredCell[];
};

export function ExportActions({
  text,
  fileStem,
  onStatus,
  consoleFrames,
  consoleWidth,
  consoleHeight,
  consoleColoredCells,
}: ExportActionsProps) {
  const [consoleScaleMode, setConsoleScaleMode] = useState<ConsoleScaleMode>("auto");
  const canOpenConsole = Boolean(text || consoleFrames?.length);

  async function handleCopy() {
    if (!text) {
      onStatus("没有可复制的字符画。");
      return;
    }

    try {
      await copyToClipboard(text);
      onStatus("已复制到剪贴板。");
    } catch (error) {
      onStatus(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleExport() {
    if (!text) {
      onStatus("没有可导出的字符画。");
      return;
    }

    try {
      const path = await chooseTxtExportPath(`${fileStem || "ascii-art"}.txt`);
      if (!path) {
        return;
      }

      await exportAsciiTxt({ text, path });
      onStatus(`已导出 TXT：${path}`);
    } catch (error) {
      onStatus(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleOpenConsole() {
    if (!canOpenConsole) {
      onStatus("没有可输出到 CMD 的字符画。");
      return;
    }

    try {
      const title = fileStem || "ascii-art";
      const request = {
        title,
        scaleMode: consoleScaleMode,
        ...(consoleFrames?.length
          ? { frames: consoleFrames }
          : {
              text,
              ...(consoleWidth ? { width: consoleWidth } : {}),
              ...(consoleHeight ? { height: consoleHeight } : {}),
              ...(consoleColoredCells?.length ? { coloredCells: consoleColoredCells } : {}),
            }),
      };
      const message = await exportAsciiConsole(request);
      onStatus(message);
    } catch (error) {
      onStatus(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <>
      <button className="secondary-button" onClick={handleCopy} disabled={!text}>
        <Copy size={17} />
        复制
      </button>
      <button className="primary-button" onClick={handleExport} disabled={!text}>
        <Download size={17} />
        导出 TXT
      </button>
      <label className="inline-control">
        CMD 适配
        <select value={consoleScaleMode} onChange={(event) => setConsoleScaleMode(event.target.value as ConsoleScaleMode)}>
          <option value="auto">自动</option>
          <option value="100">100%</option>
          <option value="75">75%</option>
          <option value="50">50%</option>
        </select>
      </label>
      <button className="secondary-button" onClick={handleOpenConsole} disabled={!canOpenConsole}>
        <Terminal size={17} />
        输出到 CMD
      </button>
    </>
  );
}

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const copied = document.execCommand("copy");
    if (!copied) {
      throw new Error("复制到剪贴板失败。");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}
