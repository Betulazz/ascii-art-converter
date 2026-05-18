import { Download } from "lucide-react";
import { chooseTxtExportPath, exportAsciiTxt } from "../lib/tauri";

type ExportActionsProps = {
  text: string;
  fileStem: string;
  onStatus: (message: string) => void;
};

export function ExportActions({ text, fileStem, onStatus }: ExportActionsProps) {
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
    <button className="primary-button" onClick={handleExport} disabled={!text}>
      <Download size={17} />
      导出 TXT
    </button>
  );
}
