import { Copy, Download } from "lucide-react";
import { chooseTxtExportPath, exportAsciiTxt } from "../lib/tauri";

type ExportActionsProps = {
  text: string;
  fileStem: string;
  onStatus: (message: string) => void;
};

export function ExportActions({ text, fileStem, onStatus }: ExportActionsProps) {
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
