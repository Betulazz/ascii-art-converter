import type { AsciiResult, ColoredCell } from "../types/ascii";

const BACKGROUND_COLOR = "#111714";
const TEXT_COLOR = "#e9f5ef";
const FONT_SIZE = 11;
const LINE_HEIGHT = 11;
const FONT_FAMILY = '"Cascadia Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace';
const FONT = `${FONT_SIZE}px ${FONT_FAMILY}`;

export async function encodeAsciiPng(result: AsciiResult): Promise<Uint8Array> {
  if (!result.text) {
    throw new Error("Cannot export empty ASCII art as PNG.");
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Cannot create a canvas context for PNG export.");
  }

  context.font = FONT;
  const charWidth = Math.max(1, context.measureText("M").width);
  const lineCount = Math.max(1, result.height || result.text.split("\n").length);
  canvas.width = Math.ceil(Math.max(result.width, longestLineLength(result.text)) * charWidth);
  canvas.height = Math.ceil(lineCount * LINE_HEIGHT);

  context.font = FONT;
  context.textBaseline = "top";
  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (result.coloredCells?.length) {
    drawColoredCells(context, result.coloredCells, result.width, charWidth);
  } else {
    drawPlainText(context, result.text);
  }

  const blob = await canvasToPngBlob(canvas);
  return new Uint8Array(await blob.arrayBuffer());
}

function drawPlainText(context: CanvasRenderingContext2D, text: string): void {
  context.fillStyle = TEXT_COLOR;
  text.split("\n").forEach((line, index) => {
    context.fillText(line, 0, index * LINE_HEIGHT);
  });
}

function drawColoredCells(
  context: CanvasRenderingContext2D,
  coloredCells: ColoredCell[],
  width: number,
  charWidth: number,
): void {
  coloredCells.forEach((cell, index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    context.fillStyle = cell.foreground;
    context.fillText(cell.char === " " ? "\u00a0" : cell.char, x * charWidth, y * LINE_HEIGHT);
  });
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Cannot encode ASCII art as PNG."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

function longestLineLength(text: string): number {
  return text.split("\n").reduce((longest, line) => Math.max(longest, line.length), 0);
}
