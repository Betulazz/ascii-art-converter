import { GIFEncoder, applyPalette, quantize } from "gifenc";
import type { GifAsciiResult } from "../types/ascii";
import { getAsciiAnimationCanvasSize, renderAsciiAnimationFrameRgba } from "./asciiAnimation";

export async function encodeAsciiGif(result: GifAsciiResult): Promise<Uint8Array> {
  if (!result.frames.length) {
    throw new Error("Cannot export an empty ASCII GIF.");
  }

  const size = getAsciiGifCanvasSize(result);
  const gif = GIFEncoder();

  result.frames.forEach((frame, index) => {
    const rgba = renderAsciiAnimationFrameRgba(frame, size.width, size.height);
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
  return getAsciiAnimationCanvasSize(result);
}
