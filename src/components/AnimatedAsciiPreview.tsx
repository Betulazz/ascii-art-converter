import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import type { GifAsciiFrame, GifAsciiResult } from "../types/ascii";

type AnimatedAsciiPreviewProps = {
  result: GifAsciiResult;
};

export function AnimatedAsciiPreview({ result }: AnimatedAsciiPreviewProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const frame = result.frames[frameIndex] ?? result.frames[0];

  useEffect(() => {
    setFrameIndex(0);
    setIsPlaying(true);
  }, [result]);

  useEffect(() => {
    if (!isPlaying || result.frames.length <= 1) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setFrameIndex((current) => (current + 1) % result.frames.length);
    }, frame?.delayMs ?? 20);

    return () => window.clearTimeout(timeout);
  }, [frame?.delayMs, frameIndex, isPlaying, result.frames.length]);

  if (!frame) {
    return <pre className="preview preview-empty">GIF contains no frames.</pre>;
  }

  return (
    <div className="animated-preview">
      <div className="animation-toolbar">
        <button className="secondary-button compact-button" type="button" onClick={() => setIsPlaying((value) => !value)}>
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          {isPlaying ? "Pause" : "Play"}
        </button>
        <span>
          Frame {frameIndex + 1} / {result.frameCount} · {frame.delayMs} ms
        </span>
      </div>
      <FramePreview frame={frame} />
    </div>
  );
}

function FramePreview({ frame }: { frame: GifAsciiFrame }) {
  if (frame.coloredCells?.length) {
    return (
      <div className="preview color-preview" style={{ gridTemplateColumns: `repeat(${frame.width}, 1ch)` }}>
        {frame.coloredCells.map((cell, index) => (
          <span key={`${index}-${cell.char}`} style={{ color: cell.foreground }}>
            {cell.char === " " ? "\u00a0" : cell.char}
          </span>
        ))}
      </div>
    );
  }

  return <pre className="preview">{frame.text}</pre>;
}
