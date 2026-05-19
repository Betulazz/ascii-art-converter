import type { AsciiResult } from "../types/ascii";

type AsciiPreviewProps = {
  result: AsciiResult | null;
  placeholder: string;
};

export function AsciiPreview({ result, placeholder }: AsciiPreviewProps) {
  if (!result?.text) {
    return <pre className="preview preview-empty">{placeholder}</pre>;
  }

  if (result.coloredCells?.length) {
    return (
      <div className="preview color-preview" style={{ gridTemplateColumns: `repeat(${result.width}, 1ch)` }}>
        {result.coloredCells.map((cell, index) => (
          <span key={`${index}-${cell.char}`} style={{ color: cell.foreground }}>
            {cell.char === " " ? "\u00a0" : cell.char}
          </span>
        ))}
      </div>
    );
  }

  return <pre className="preview">{result.text}</pre>;
}
