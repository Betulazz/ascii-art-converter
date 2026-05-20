import { useMemo, useState } from "react";
import { FolderOpen, Wand2 } from "lucide-react";
import { AnimatedAsciiPreview } from "./AnimatedAsciiPreview";
import { ExportActions } from "./ExportActions";
import { ParameterPanel } from "./ParameterPanel";
import { VideoExportActions } from "./VideoExportActions";
import { chooseVideoOpenPath, convertVideoToAscii } from "../lib/tauri";
import type { VideoAsciiResult } from "../types/ascii";
import { buildGifExportText } from "./ImageAsciiTab";

const DEFAULT_CHARSET = "@%#*+=-:. ";
const DEFAULT_VIDEO_FPS = 8;

export function VideoAsciiTab() {
  const [path, setPath] = useState<string | null>(null);
  const [outputWidth, setOutputWidth] = useState(120);
  const [charset, setCharset] = useState(DEFAULT_CHARSET);
  const [invert, setInvert] = useState(false);
  const [preserveAspectRatio, setPreserveAspectRatio] = useState(true);
  const [colorPreview, setColorPreview] = useState(false);
  const [result, setResult] = useState<VideoAsciiResult | null>(null);
  const [status, setStatus] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  const fileName = useMemo(() => (path ? baseName(path) : ""), [path]);
  const fileStem = useMemo(() => fileName.replace(/\.[^.]+$/, "") || "ascii-video", [fileName]);
  const exportText = result ? buildGifExportText(result) : "";
  const consoleFrames = result?.frames.map((frame) => ({
    text: frame.text,
    width: frame.width,
    height: frame.height,
    delayMs: frame.delayMs,
    coloredCells: frame.coloredCells,
  }));

  async function handleSelectVideo() {
    try {
      const selected = await chooseVideoOpenPath();
      if (!selected) {
        return;
      }
      setPath(selected);
      setResult(null);
      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleConvert() {
    if (!path || !fileName) {
      setStatus("请选择视频文件。");
      return;
    }

    setIsWorking(true);
    setStatus("正在转换视频...");

    try {
      const converted = await convertVideoToAscii({
        path,
        fileName,
        outputWidth,
        charset,
        invert,
        preserveAspectRatio,
        colorPreview,
        targetFps: DEFAULT_VIDEO_FPS,
      });
      setResult(converted);
      setStatus(
        `视频转换完成：${converted.frameCount} 帧，${converted.width} x ${converted.height}，${converted.totalDurationMs} ms`,
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
          <button className="secondary-button full-width-button" type="button" onClick={handleSelectVideo}>
            <FolderOpen size={17} />
            选择视频
          </button>
          {fileName && <p className="file-name">{fileName}</p>}
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
          <button className="primary-button" onClick={handleConvert} disabled={isWorking || !path}>
            <Wand2 size={17} />
            {isWorking ? "转换中" : "生成字符画"}
          </button>
          <ExportActions text={exportText} fileStem={fileStem} onStatus={setStatus} consoleFrames={consoleFrames} />
          {result && <VideoExportActions result={result} fileStem={fileStem} onStatus={setStatus} />}
        </div>
        {status && <p className="status">{status}</p>}
      </aside>
      <section className="preview-column">
        {result ? (
          <AnimatedAsciiPreview result={result} />
        ) : (
          <pre className="preview preview-empty">选择视频并生成后，字符画视频会显示在这里。</pre>
        )}
      </section>
    </div>
  );
}

function baseName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}
