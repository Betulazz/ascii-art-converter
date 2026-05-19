import { GIFEncoder, applyPalette, quantize } from "gifenc";
import type { GifAsciiFrame, GifAsciiResult } from "../types/ascii";

const FONT_SIZE = 11;
const CELL_WIDTH = 8;
const LINE_HEIGHT = 12;
const PADDING = 12;
const BACKGROUND = "#111714";
const FOREGROUND = "#e9f5ef";
const FONT_STACK = `"Cascadia Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace`;

export async function encodeAsciiGif(result: GifAsciiResult): Promise<Uint8Array> {
  if (!result.frames.length) {
    throw new Error("Cannot export an empty ASCII GIF.");
  }

  const size = getAsciiGifCanvasSize(result);
  const gif = GIFEncoder();

  result.frames.forEach((frame, index) => {
    const rgba = renderFrame(frame, size.width, size.height);
    const palette = quantize(rgba, 256);
    const indexed = applyPalette(rgba, palette);
    gif.writeFrame(indexed, size.width, size.height, {
      palette,
      delay: frame.delayMs,
      repeat: index === 0 ? 0 : undefined,
    });
  });

  gif.finish();
  return gif.bytes();
}

export function getAsciiGifCanvasSize(result: GifAsciiResult): { width: number; height: number } {
  return {
    width: result.width * CELL_WIDTH + PADDING * 2,
    height: result.height * LINE_HEIGHT + PADDING * 2,
  };
}

function renderFrame(frame: GifAsciiFrame, canvasWidth: number, canvasHeight: number): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Canvas is not available for GIF export.");
  }

  context.fillStyle = BACKGROUND;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = `${FONT_SIZE}px ${FONT_STACK}`;
  context.textBaseline = "top";

  if (frame.coloredCells?.length) {
    frame.coloredCells.forEach((cell, index) => {
      const x = index % frame.width;
      const y = Math.floor(index / frame.width);
      drawChar(context, cell.char, x, y, cell.foreground);
    });
  } else {
    frame.text.split("\n").forEach((line, y) => {
      Array.from(line).forEach((char, x) => drawChar(context, char, x, y, FOREGROUND));
    });
  }

  return context.getImageData(0, 0, canvas.width, canvas.height).data;
}

function drawChar(context: CanvasRenderingContext2D, char: string, x: number, y: number, color: string): void {
  if (char === " ") {
    return;
  }

  context.fillStyle = color;
  context.fillText(char, PADDING + x * CELL_WIDTH, PADDING + y * LINE_HEIGHT);
}
