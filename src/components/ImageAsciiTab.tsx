import { useMemo, useState } from "react";
import { Wand2 } from "lucide-react";
import { AsciiPreview } from "./AsciiPreview";
import { ExportActions } from "./ExportActions";
import { ParameterPanel } from "./ParameterPanel";
import { convertImageToAscii } from "../lib/tauri";
import type { AsciiResult } from "../types/ascii";

const DEFAULT_CHARSET = "@%#*+=-:. ";
const ACCEPTED_IMAGE_TYPES = ".png,.jpg,.jpeg,.bmp,.webp";

export function ImageAsciiTab() {
  const [file, setFile] = useState<File | null>(null);
  const [outputWidth, setOutputWidth] = useState(120);
  const [charset, setCharset] = useState(DEFAULT_CHARSET);
  const [invert, setInvert] = useState(false);
  const [preserveAspectRatio, setPreserveAspectRatio] = useState(true);
  const [colorPreview, setColorPreview] = useState(false);
  const [result, setResult] = useState<AsciiResult | null>(null);
  const [status, setStatus] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  const fileStem = useMemo(() => file?.name.replace(/\.[^.]+$/, "") ?? "ascii-art", [file]);

  async function handleConvert() {
    if (!file) {
      setStatus("请选择图片文件。");
      return;
    }

    setIsWorking(true);
    setStatus("正在转换图片...");

    try {
      const imageBytes = Array.from(new Uint8Array(await file.arrayBuffer()));
      const converted = await convertImageToAscii({
        imageBytes,
        fileName: file.name,
        outputWidth,
        charset,
        invert,
        preserveAspectRatio,
        colorPreview,
      });
      setResult(converted);
      setStatus(`转换完成：${converted.width} x ${converted.height}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div className="tab-layout">
      <aside className="side-column">
        <div className="panel">
          <label>
            图片文件
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          {file && <p className="file-name">{file.name}</p>}
        </div>
        <ParameterPanel
          outputWidth={outputWidth}
          charset={charset}
          invert={invert}
          preserveAspectRatio={preserveAspectRatio}
          colorPreview={colorPreview}
          onOutputWidthChange={setOutputWidth}
          onCharsetChange={setCharset}
          onInvertChange={setInvert}
          onPreserveAspectRatioChange={setPreserveAspectRatio}
          onColorPreviewChange={setColorPreview}
        />
        <div className="actions">
          <button className="primary-button" onClick={handleConvert} disabled={isWorking}>
            <Wand2 size={17} />
            {isWorking ? "转换中" : "生成字符画"}
          </button>
          <ExportActions text={result?.text ?? ""} fileStem={fileStem} onStatus={setStatus} />
        </div>
        {status && <p className="status">{status}</p>}
      </aside>
      <section className="preview-column">
        <AsciiPreview result={result} placeholder="选择图片并生成后，字符画会显示在这里。" />
      </section>
    </div>
  );
}
