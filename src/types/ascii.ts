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

export type ExportTxtRequest = {
  text: string;
  path: string;
};

export type TextAsciiRequest = {
  text: string;
  fontName: string;
  horizontalLayout: "default" | "full" | "fitted";
};

export type AppTab = "image" | "text";
