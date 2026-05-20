import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { GifAsciiFrame, GifAsciiResult } from "../types/ascii";

const COLOR_FONT_SIZE = 11;
const COLOR_LINE_HEIGHT = 11;
const COLOR_FONT_FAMILY = '"Cascadia Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace';
const COLOR_FONT = `${COLOR_FONT_SIZE}px ${COLOR_FONT_FAMILY}`;

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
    return <ColoredFrameCanvas frame={frame} />;
  }

  return <pre className="preview">{frame.text}</pre>;
}

function ColoredFrameCanvas({ frame }: { frame: GifAsciiFrame }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !frame.coloredCells?.length) {
      return;
    }

    context.font = COLOR_FONT;
    const charWidth = Math.max(1, context.measureText("M").width);
    canvas.width = Math.ceil(frame.width * charWidth);
    canvas.height = Math.ceil(frame.height * COLOR_LINE_HEIGHT);

    context.font = COLOR_FONT;
    context.textBaseline = "top";
    context.clearRect(0, 0, canvas.width, canvas.height);

    frame.coloredCells.forEach((cell, index) => {
      const x = index % frame.width;
      const y = Math.floor(index / frame.width);
      context.fillStyle = cell.foreground;
      context.fillText(cell.char === " " ? "\u00a0" : cell.char, x * charWidth, y * COLOR_LINE_HEIGHT);
    });
  }, [frame]);

  return (
    <div className="preview color-preview color-preview-canvas-frame">
      <canvas ref={canvasRef} className="color-preview-canvas" aria-label="Colored GIF frame preview" />
    </div>
  );
}
