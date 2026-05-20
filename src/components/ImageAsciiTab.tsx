import { useMemo, useState } from "react";
import { Wand2 } from "lucide-react";
import { AnimatedAsciiPreview } from "./AnimatedAsciiPreview";
import { AsciiPreview } from "./AsciiPreview";
import { ExportActions } from "./ExportActions";
import { GifExportActions } from "./GifExportActions";
import { ImageExportActions } from "./ImageExportActions";
import { ParameterPanel } from "./ParameterPanel";
import { convertGifToAscii, convertImageToAscii } from "../lib/tauri";
import type { GifAsciiResult, ImageConversionResult } from "../types/ascii";

const DEFAULT_CHARSET = "@%#*+=-:. ";
const ACCEPTED_IMAGE_TYPES = ".png,.jpg,.jpeg,.bmp,.webp,.gif";

export function ImageAsciiTab() {
  const [file, setFile] = useState<File | null>(null);
  const [outputWidth, setOutputWidth] = useState(120);
  const [charset, setCharset] = useState(DEFAULT_CHARSET);
  const [invert, setInvert] = useState(false);
  const [preserveAspectRatio, setPreserveAspectRatio] = useState(true);
  const [colorPreview, setColorPreview] = useState(false);
  const [result, setResult] = useState<ImageConversionResult | null>(null);
  const [status, setStatus] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  const fileStem = useMemo(() => file?.name.replace(/\.[^.]+$/, "") ?? "ascii-art", [file]);
  const exportText = result ? (isGifAsciiResult(result) ? buildGifExportText(result) : result.text) : "";

  async function handleConvert() {
    if (!file) {
      setStatus("\u8bf7\u9009\u62e9\u56fe\u7247\u6587\u4ef6\u3002");
      return;
    }

    setIsWorking(true);
    setStatus(isGifFile(file.name) ? "\u6b63\u5728\u8f6c\u6362 GIF..." : "\u6b63\u5728\u8f6c\u6362\u56fe\u7247...");

    try {
      const imageBytes = Array.from(new Uint8Array(await file.arrayBuffer()));
      const request = {
        imageBytes,
        fileName: file.name,
        outputWidth,
        charset,
        invert,
        preserveAspectRatio,
        colorPreview,
      };
      const converted = isGifFile(file.name) ? await convertGifToAscii(request) : await convertImageToAscii(request);
      setResult(converted);
      setStatus(
        isGifAsciiResult(converted)
          ? `GIF \u8f6c\u6362\u5b8c\u6210\uff1a${converted.frameCount} \u5e27\uff0c${converted.width} x ${converted.height}\uff0c${converted.totalDurationMs} ms`
          : `\u8f6c\u6362\u5b8c\u6210\uff1a${converted.width} x ${converted.height}`,
      );
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
            {"\u56fe\u7247\u6587\u4ef6"}
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
            {isWorking ? "\u8f6c\u6362\u4e2d" : "\u751f\u6210\u5b57\u7b26\u753b"}
          </button>
          <ExportActions text={exportText} fileStem={fileStem} onStatus={setStatus} />
          {result &&
            (isGifAsciiResult(result) ? (
              <GifExportActions result={result} fileStem={fileStem} onStatus={setStatus} />
            ) : (
              <ImageExportActions result={result} fileStem={fileStem} onStatus={setStatus} />
            ))}
        </div>
        {status && <p className="status">{status}</p>}
      </aside>
      <section className="preview-column">
        {isGifAsciiResult(result) ? (
          <AnimatedAsciiPreview result={result} />
        ) : (
          <AsciiPreview
            result={result}
            placeholder={"\u9009\u62e9\u56fe\u7247\u5e76\u751f\u6210\u540e\uff0c\u5b57\u7b26\u753b\u4f1a\u663e\u793a\u5728\u8fd9\u91cc\u3002"}
          />
        )}
      </section>
    </div>
  );
}

export function buildGifExportText(result: GifAsciiResult): string {
  return result.frames
    .map((frame, index) => [`Frame ${index + 1} / ${result.frameCount} (${frame.delayMs} ms)`, frame.text].join("\n"))
    .join("\n\n");
}

function isGifFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".gif");
}

function isGifAsciiResult(result: ImageConversionResult | null): result is GifAsciiResult {
  return Boolean(result && "frames" in result);
}
