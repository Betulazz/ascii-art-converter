import type { AnimatedAsciiResult } from "../types/ascii";
import { getAsciiAnimationCanvasSize, renderAsciiAnimationFrame } from "./asciiAnimation";

export async function encodeAsciiVideoFrames(result: AnimatedAsciiResult): Promise<Uint8Array[]> {
  if (!result.frames.length) {
    throw new Error("Cannot export an empty ASCII video.");
  }

  const size = getAsciiAnimationCanvasSize(result);
  const frames: Uint8Array[] = [];

  for (const frame of result.frames) {
    const canvas = renderAsciiAnimationFrame(frame, size.width, size.height);
    const blob = await canvasToPngBlob(canvas);
    frames.push(new Uint8Array(await blob.arrayBuffer()));
  }

  return frames;
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Cannot encode ASCII video frame as PNG."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}
