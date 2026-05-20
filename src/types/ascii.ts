export type ColoredCell = {
  char: string;
  foreground: string;
};

export type ImageAsciiRequest = {
  imageBytes: number[];
  fileName: string;
  outputWidth: number;
  charset: string;
  invert: boolean;
  preserveAspectRatio: boolean;
  colorPreview: boolean;
};

export type AsciiResult = {
  text: string;
  width: number;
  height: number;
  coloredCells?: ColoredCell[];
};

export type GifAsciiFrame = {
  text: string;
  width: number;
  height: number;
  delayMs: number;
  coloredCells?: ColoredCell[];
};

export type GifAsciiResult = {
  frames: GifAsciiFrame[];
  width: number;
  height: number;
  frameCount: number;
  totalDurationMs: number;
};

export type ImageConversionResult = AsciiResult | GifAsciiResult;

export type ExportTxtRequest = {
  text: string;
  path: string;
};

export type ExportGifRequest = {
  gifBytes: number[];
  path: string;
};

export type ExportPngRequest = {
  pngBytes: number[];
  path: string;
};

export type ExportConsoleFrame = {
  text: string;
  width?: number;
  height?: number;
  delayMs: number;
  coloredCells?: ColoredCell[];
};

export type ConsoleScaleMode = "auto" | "100" | "75" | "50";

export type ExportConsoleRequest = {
  title: string;
  scaleMode?: ConsoleScaleMode;
  text?: string;
  width?: number;
  height?: number;
  coloredCells?: ColoredCell[];
  frames?: ExportConsoleFrame[];
};

export type TextAsciiRequest = {
  text: string;
  fontName: string;
  horizontalLayout: "default" | "full" | "fitted";
};

export type AppTab = "image" | "text";
